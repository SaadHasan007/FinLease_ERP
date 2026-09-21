from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime

class ContractBase(BaseModel):
    application_id: UUID
    principal_amount: Decimal
    interest_rate: Decimal
    tenure_months: int
    status: str
    start_date: date
    end_date: date

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    principal_amount: Optional[Decimal] = None
    interest_rate: Optional[Decimal] = None
    tenure_months: Optional[int] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ContractResponse(ContractBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
