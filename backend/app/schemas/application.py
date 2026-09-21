from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

class FinanceApplicationBase(BaseModel):
    customer_id: UUID
    asset_id: Optional[UUID] = None
    requested_amount: Decimal = Field(..., gt=0)
    down_payment: Decimal = Field(default=Decimal("0"), ge=0)
    tenure_months: int = Field(default=12, gt=0)
    status: str = "DRAFT"
    notes: Optional[str] = None

    @field_validator('requested_amount', mode='after')
    @classmethod
    def validate_requested_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal('0'):
            raise ValueError('Requested amount must be strictly greater than 0')
        return v

class FinanceApplicationCreate(FinanceApplicationBase):
    pass

class FinanceApplicationUpdate(BaseModel):
    customer_id: Optional[UUID] = None
    asset_id: Optional[UUID] = None
    requested_amount: Optional[Decimal] = None
    down_payment: Optional[Decimal] = None
    tenure_months: Optional[int] = None
    notes: Optional[str] = None


class ApplicationDecisionCreate(BaseModel):
    reason: str


class ApplicationDecisionResponse(BaseModel):
    id: UUID
    application_id: UUID
    previous_status: str
    new_status: str
    reason: str
    decided_by: UUID
    decided_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FinanceApplicationResponse(FinanceApplicationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
