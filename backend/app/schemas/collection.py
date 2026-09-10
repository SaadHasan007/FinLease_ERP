from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from decimal import Decimal
import datetime

class CollectionCaseBase(BaseModel):
    contract_id: int
    status: str
    assigned_to: Optional[int] = None
    outstanding_amount: Decimal

class CollectionCaseCreate(CollectionCaseBase):
    pass

class CollectionCaseUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    outstanding_amount: Optional[Decimal] = None

class CollectionCaseResponse(CollectionCaseBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class CollectionActionBase(BaseModel):
    case_id: int
    action_type: str
    notes: Optional[str] = None
    promise_amount: Optional[Decimal] = None
    promise_date: Optional[datetime.date] = None
    performed_by: int

class CollectionActionCreate(CollectionActionBase):
    pass

class CollectionActionUpdate(BaseModel):
    notes: Optional[str] = None

class CollectionActionResponse(CollectionActionBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)
