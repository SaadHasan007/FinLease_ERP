from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

class FinanceApplicationBase(BaseModel):
    customer_id: UUID
    asset_id: UUID
    requested_amount: Decimal
    down_payment: Decimal
    tenure_months: int
    status: str
    notes: Optional[str] = None

class FinanceApplicationCreate(FinanceApplicationBase):
    pass

class FinanceApplicationUpdate(BaseModel):
    requested_amount: Optional[Decimal] = None
    down_payment: Optional[Decimal] = None
    tenure_months: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class FinanceApplicationResponse(FinanceApplicationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
