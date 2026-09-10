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
    status: Optional[str] = None

class ContractResponse(ContractBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
