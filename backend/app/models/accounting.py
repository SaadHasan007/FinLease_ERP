from sqlalchemy import String, Numeric, Date, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from app.models.base import Base, AuditMixin, AuditMixin
import enum

class AccountType(str, enum.Enum):
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"
    EQUITY = "EQUITY"
    REVENUE = "REVENUE"
    EXPENSE = "EXPENSE"

class JournalEntryStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    POSTED = "POSTED"

class Account(AuditMixin, Base):
    __tablename__ = "accounts"
    
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    account_type: Mapped[str] = mapped_column(String, nullable=False)
    current_balance = mapped_column(Numeric(18, 4), default=0)

class JournalEntry(AuditMixin, Base):
    __tablename__ = "journal_entries"
    
    date = mapped_column(Date, nullable=False)
    reference: Mapped[str] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default=JournalEntryStatus.DRAFT.value)

    lines: Mapped[List["JournalEntryLine"]] = relationship("JournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan")

class JournalEntryLine(AuditMixin, Base):
    __tablename__ = "journal_entry_lines"
    
    journal_entry_id = mapped_column(ForeignKey("journal_entries.id"), nullable=False)
    account_id = mapped_column(ForeignKey("accounts.id"), nullable=False)
    debit = mapped_column(Numeric(18, 4), default=0)
    credit = mapped_column(Numeric(18, 4), default=0)

    journal_entry: Mapped["JournalEntry"] = relationship("JournalEntry", back_populates="lines")
    account: Mapped["Account"] = relationship("Account")
