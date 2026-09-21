from app.services.application_service import ApplicationService
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.schemas.application import ApplicationDecisionCreate, ApplicationDecisionResponse, FinanceApplicationCreate, FinanceApplicationUpdate, FinanceApplicationResponse
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/", response_model=FinanceApplicationResponse, status_code=201)
async def create_application(
    data: FinanceApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ApplicationService(db)
    application = await service.create(data)
    await AuditService.log(
        action="APPLICATION_CREATE",
        entity_name="finance_application",
        entity_id=application.id,
        performed_by=current_user.id,
    )
    return application

@router.get("/{id}", response_model=FinanceApplicationResponse)
async def get_application(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ApplicationService(db)
    application = await service.get(id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@router.get("/", response_model=List[FinanceApplicationResponse])
async def list_applications(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ApplicationService(db)
    return await service.get_multi(skip=skip, limit=limit)

@router.put("/{id}", response_model=FinanceApplicationResponse)
@router.patch("/{id}", response_model=FinanceApplicationResponse)
async def update_application(
    id: UUID,
    data: FinanceApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.model_dump(exclude_unset=True).get("status") is not None:
        raise HTTPException(status_code=400, detail="Use a decision action to change application status")
    service = ApplicationService(db)
    application = await service.update(id, data)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    await AuditService.log(
        action="APPLICATION_UPDATE",
        entity_name="finance_application",
        entity_id=application.id,
        performed_by=current_user.id,
    )
    return application


async def _decide_application(
    id: UUID,
    new_status: str,
    data: ApplicationDecisionCreate,
    db: AsyncSession,
    current_user: User,
):
    service = ApplicationService(db)
    try:
        application, decision = await service.decide(id, new_status, data.reason, current_user.id)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    if not application or not decision:
        raise HTTPException(status_code=404, detail="Application not found")
    await AuditService.log(
        action=f"APPLICATION_{new_status}",
        entity_name="finance_application",
        entity_id=application.id,
        performed_by=current_user.id,
        old_values={"status": decision.previous_status},
        new_values={"status": decision.new_status, "reason": decision.reason},
    )
    return application


@router.post("/{id}/submit", response_model=FinanceApplicationResponse)
async def submit_application(
    id: UUID,
    data: ApplicationDecisionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["LEASING_OFFICER", "CREDIT_OFFICER", "MANAGER"])),
):
    return await _decide_application(id, "UNDER_REVIEW", data, db, current_user)


@router.post("/{id}/approve", response_model=FinanceApplicationResponse)
async def approve_application(
    id: UUID,
    data: ApplicationDecisionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["CREDIT_OFFICER", "MANAGER"])),
):
    return await _decide_application(id, "APPROVED", data, db, current_user)


@router.post("/{id}/reject", response_model=FinanceApplicationResponse)
async def reject_application(
    id: UUID,
    data: ApplicationDecisionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["CREDIT_OFFICER", "MANAGER"])),
):
    return await _decide_application(id, "REJECTED", data, db, current_user)


@router.get("/{id}/history", response_model=list[ApplicationDecisionResponse])
@router.get("/{id}/decisions", response_model=list[ApplicationDecisionResponse])
async def list_application_decisions(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ApplicationService(db)
    if not await service.get(id):
        raise HTTPException(status_code=404, detail="Application not found")
    return await service.decisions(id)

@router.delete("/{id}", status_code=204)
async def delete_application(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ApplicationService(db)
    success = await service.delete(id)
    if not success:
        raise HTTPException(status_code=404, detail="Application not found")
    await AuditService.log(
        action="APPLICATION_DELETE",
        entity_name="finance_application",
        entity_id=id,
        performed_by=current_user.id,
    )
