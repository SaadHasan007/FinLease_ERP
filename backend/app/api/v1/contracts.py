from app.services.contract_service import ContractService
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.contract import ContractCreate, ContractUpdate, ContractResponse
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/", response_model=ContractResponse, status_code=201)
async def create_contract(
    data: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ContractService(db)
    contract = await service.create(data)
    await AuditService.log(
        action="CONTRACT_CREATE",
        entity_name="contract",
        entity_id=contract.id,
        performed_by=current_user.id,
    )
    return contract

@router.get("/{id}", response_model=ContractResponse)
async def get_contract(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ContractService(db)
    contract = await service.get(id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

@router.get("/", response_model=List[ContractResponse])
async def list_contracts(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ContractService(db)
    return await service.get_multi(skip=skip, limit=limit)

@router.put("/{id}", response_model=ContractResponse)
async def update_contract(
    id: UUID,
    data: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ContractService(db)
    contract = await service.update(id, data)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    await AuditService.log(
        action="CONTRACT_UPDATE",
        entity_name="contract",
        entity_id=contract.id,
        performed_by=current_user.id,
    )
    return contract

@router.delete("/{id}", status_code=204)
async def delete_contract(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ContractService(db)
    success = await service.delete(id)
    if not success:
        raise HTTPException(status_code=404, detail="Contract not found")
    await AuditService.log(
        action="CONTRACT_DELETE",
        entity_name="contract",
        entity_id=id,
        performed_by=current_user.id,
    )
