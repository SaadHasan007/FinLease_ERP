from sqlalchemy import Column, String, ForeignKey, Text, Date, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from decimal import Decimal
import datetime
import uuid
from app.models.base import Base, AuditMixin

class CollectionCase(AuditMixin, Base):
    __tablename__ = "collection_cases"

    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="OPEN") # OPEN/IN_PROGRESS/PROMISE_TO_PAY/ESCALATED/CLOSED/LEGAL
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    outstanding_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)

    actions = relationship("CollectionAction", back_populates="case")

class CollectionAction(AuditMixin, Base):
    __tablename__ = "collection_actions"

    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("collection_cases.id"), nullable=False)
    action_type: Mapped[str] = mapped_column(String, nullable=False) # PHONE/EMAIL/SMS/LETTER/VISIT
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    promise_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 4), nullable=True)
    promise_date: Mapped[Optional[datetime.date]] = mapped_column(Date, nullable=True)
    performed_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    case = relationship("CollectionCase", back_populates="actions")
