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

@router.get("/", response_model=List[CustomerResponse])
async def read_customers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER", "USER"]))
):
    """Retrieve customers."""

@router.get("/{customer_id}", response_model=CustomerResponse)
async def read_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER", "USER"]))
):
    """Get customer by ID."""
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    customer_in: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER", "USER"]))
):
    """Update a customer."""
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

@router.delete("/{customer_id}", response_model=CustomerResponse)
async def delete_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER", "USER"]))
):
    """Delete a customer."""
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
