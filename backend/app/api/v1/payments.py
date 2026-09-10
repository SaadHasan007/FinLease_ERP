from app.services.payment_service import PaymentService
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.payment import PaymentScheduleCreate, PaymentScheduleUpdate, PaymentScheduleResponse
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/", response_model=PaymentScheduleResponse, status_code=201)
async def create_payment_schedule(
    data: PaymentScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentService(db)
    payment = await service.create(data)
    await AuditService.log(
        action="PAYMENT_SCHEDULE_CREATE",
        entity_name="payment_schedule",
        entity_id=payment.id,
        performed_by=current_user.id,
    )
    return payment

@router.get("/{id}", response_model=PaymentScheduleResponse)
async def get_payment_schedule(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentService(db)
    payment = await service.get(id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    return payment

@router.get("/", response_model=List[PaymentScheduleResponse])
async def list_payment_schedules(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentService(db)
    return await service.get_multi(skip=skip, limit=limit)

@router.put("/{id}", response_model=PaymentScheduleResponse)
async def update_payment_schedule(
    id: UUID,
    data: PaymentScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentService(db)
    payment = await service.update(id, data)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    await AuditService.log(
        action="PAYMENT_SCHEDULE_UPDATE",
        entity_name="payment_schedule",
        entity_id=payment.id,
        performed_by=current_user.id,
    )
    return payment

@router.delete("/{id}", status_code=204)
async def delete_payment_schedule(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentService(db)
    success = await service.delete(id)
    if not success:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    await AuditService.log(
        action="PAYMENT_SCHEDULE_DELETE",
        entity_name="payment_schedule",
        entity_id=id,
        performed_by=current_user.id,
    )
