from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal

from app.models.asset import AssetCategory, AssetStatus

class AssetBase(BaseModel):
    category: AssetCategory
    make: Optional[str] = None
    model_name: Optional[str] = None
    year: Optional[int] = None
    serial_number: str
    status: AssetStatus = AssetStatus.AVAILABLE
    current_value: Decimal

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    category: Optional[AssetCategory] = None
    make: Optional[str] = None
    model_name: Optional[str] = None
    year: Optional[int] = None
    serial_number: Optional[str] = None
    status: Optional[AssetStatus] = None
    current_value: Optional[Decimal] = None

class AssetResponse(AssetBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
