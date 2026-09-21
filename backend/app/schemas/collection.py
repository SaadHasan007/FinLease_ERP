from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from decimal import Decimal
import datetime
from uuid import UUID

class CollectionCaseBase(BaseModel):
    contract_id: UUID
    status: str = "OPEN"
    assigned_to: Optional[UUID] = None
    outstanding_amount: Decimal = Decimal("0.0000")

class CollectionCaseCreate(CollectionCaseBase):
    pass

class CollectionCaseUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[UUID] = None
    outstanding_amount: Optional[Decimal] = None

class CollectionCaseResponse(CollectionCaseBase):
    id: UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class CollectionActionBase(BaseModel):
    case_id: UUID
    action_type: str
    notes: Optional[str] = None
    promise_amount: Optional[Decimal] = None
    promise_date: Optional[datetime.date] = None
    performed_by: Optional[UUID] = None

class CollectionActionCreate(CollectionActionBase):
    pass

class CollectionActionUpdate(BaseModel):
    notes: Optional[str] = None

class CollectionActionResponse(CollectionActionBase):
    id: UUID
    performed_by: UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)
