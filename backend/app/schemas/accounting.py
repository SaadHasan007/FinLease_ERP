from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import List, Optional, Union
from decimal import Decimal
from uuid import UUID
from app.models.accounting import AccountType, JournalEntryStatus

class AccountBase(BaseModel):
    code: str
    name: str
    account_type: str

class AccountCreate(AccountBase):
    current_balance: Decimal = Decimal('0.0000')

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None

class AccountResponse(AccountBase):
    id: UUID
    current_balance: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JournalEntryLineCreate(BaseModel):
    account_id: UUID
    debit: Decimal = Decimal('0.0000')
    credit: Decimal = Decimal('0.0000')

class JournalEntryLineResponse(BaseModel):
    id: UUID
    journal_entry_id: UUID
    account_id: UUID
    debit: Decimal
    credit: Decimal

    model_config = ConfigDict(from_attributes=True)

class JournalEntryBase(BaseModel):
    date: date
    reference: Optional[str] = None
    description: Optional[str] = None
    status: str = "DRAFT"

class JournalEntryCreate(JournalEntryBase):
    lines: List[JournalEntryLineCreate]

class JournalEntryUpdate(BaseModel):
    reference: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class JournalEntryResponse(JournalEntryBase):
    id: UUID
    lines: List[JournalEntryLineResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
