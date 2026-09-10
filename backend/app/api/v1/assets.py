from app.services.asset_service import AssetService
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_role
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse

router = APIRouter()

@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    *,
    db: AsyncSession = Depends(get_db),
    asset_in: AssetCreate,
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER"]))
):
    """Create a new asset."""

@router.get("/", response_model=List[AssetResponse])
async def read_assets(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER"]))
):
    """Retrieve assets."""

@router.get("/{asset_id}", response_model=AssetResponse)
async def read_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER"]))
):
    """Get asset by ID."""
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: UUID,
    asset_in: AssetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER"]))
):
    """Update an asset."""
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

@router.delete("/{asset_id}", response_model=AssetResponse)
async def delete_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["SUPER_ADMIN", "MANAGER"]))
):
    """Delete an asset."""
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
