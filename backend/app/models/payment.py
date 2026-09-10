from sqlalchemy import Column, String, Numeric, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, AuditMixin

class PaymentSchedule(AuditMixin, Base):
    __tablename__ = "payment_schedules"


    contract_id = Column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False)
    due_date = Column(Date, nullable=False)
    principal_amount = Column(Numeric(18, 4), nullable=False)
    interest_amount = Column(Numeric(18, 4), nullable=False)
    total_amount = Column(Numeric(18, 4), nullable=False)
    status = Column(String(50), nullable=False, default="PENDING") # PENDING/PARTIALLY_PAID/PAID/OVERDUE

    contract = relationship("Contract")
