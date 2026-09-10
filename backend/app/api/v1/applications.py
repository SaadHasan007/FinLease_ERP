from app.services.application_service import ApplicationService
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.application import FinanceApplicationCreate, FinanceApplicationUpdate, FinanceApplicationResponse
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
async def update_application(
    id: UUID,
    data: FinanceApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
