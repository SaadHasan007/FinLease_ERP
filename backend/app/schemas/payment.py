from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime

class PaymentScheduleBase(BaseModel):
    contract_id: UUID
    due_date: date
    principal_amount: Decimal
    interest_amount: Decimal
    total_amount: Decimal
    status: str

class PaymentScheduleCreate(PaymentScheduleBase):
    pass

class PaymentScheduleUpdate(BaseModel):
    status: Optional[str] = None
    due_date: Optional[date] = None
    principal_amount: Optional[Decimal] = None
    interest_amount: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None

class PaymentScheduleResponse(PaymentScheduleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
