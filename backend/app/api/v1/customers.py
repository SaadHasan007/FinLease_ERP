from app.services.customer_service import CustomerService
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_role
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter()

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    *,
    db: AsyncSession = Depends(get_db),
    customer_in: CustomerCreate,
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER", "USER"]))
):
    """Create a new customer."""
    service = CustomerService(db)
    return await service.create(customer_in)

@router.get("/", response_model=List[CustomerResponse])
async def read_customers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER", "USER"]))
):
    """Retrieve customers."""
    service = CustomerService(db)
    return await service.get_multi(skip=skip, limit=limit)

@router.get("/{customer_id}", response_model=CustomerResponse)
async def read_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER", "USER"]))
):
    """Get customer by ID."""
    service = CustomerService(db)
    customer = await service.get(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    customer_in: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER", "USER"]))
):
    """Update a customer."""
    service = CustomerService(db)
    customer = await service.update(customer_id, customer_in)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.delete("/{customer_id}", response_model=CustomerResponse)
async def delete_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER", "USER"]))
):
    """Delete a customer."""
    service = CustomerService(db)
    customer = await service.delete(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
