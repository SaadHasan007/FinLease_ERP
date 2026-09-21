from sqlalchemy import Column, String, Integer, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, AuditMixin

class FinanceApplication(AuditMixin, Base):
    __tablename__ = "finance_applications"

    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    requested_amount = Column(Numeric(18, 4), nullable=False)
    down_payment = Column(Numeric(18, 4), nullable=False, default=0)
    tenure_months = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="DRAFT") # DRAFT/UNDER_REVIEW/APPROVED/REJECTED
    notes = Column(Text, nullable=True)

    customer = relationship("Customer")
    asset = relationship("Asset")
    decisions = relationship("ApplicationDecision", back_populates="application", order_by="ApplicationDecision.decided_at")


class ApplicationDecision(AuditMixin, Base):
    __tablename__ = "application_decisions"

    application_id = Column(UUID(as_uuid=True), ForeignKey("finance_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    decided_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=False)

    application = relationship("FinanceApplication", back_populates="decisions")
    actor = relationship("User")
