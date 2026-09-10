from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import List, Optional
from decimal import Decimal
from app.models.accounting import AccountType, JournalEntryStatus

class AccountBase(BaseModel):
    code: str
    name: str
    account_type: AccountType

class AccountCreate(AccountBase):
    current_balance: Decimal = Decimal('0.0000')

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[AccountType] = None

class AccountResponse(AccountBase):
    id: str
    current_balance: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class JournalEntryLineCreate(BaseModel):
    account_id: str
    debit: Decimal = Decimal('0.0000')
    credit: Decimal = Decimal('0.0000')

class JournalEntryLineResponse(JournalEntryLineCreate):
    id: str
    journal_entry_id: str

    class Config:
        from_attributes = True

class JournalEntryBase(BaseModel):
    date: date
    reference: Optional[str] = None
    description: Optional[str] = None
    status: JournalEntryStatus = JournalEntryStatus.DRAFT

class JournalEntryCreate(JournalEntryBase):
    lines: List[JournalEntryLineCreate]

class JournalEntryUpdate(BaseModel):
    reference: Optional[str] = None
    description: Optional[str] = None
    status: Optional[JournalEntryStatus] = None

class JournalEntryResponse(JournalEntryBase):
    id: str
    lines: List[JournalEntryLineResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
