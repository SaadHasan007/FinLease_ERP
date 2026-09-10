from sqlalchemy import Column, String, Integer, Numeric, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, AuditMixin

class FinanceApplication(AuditMixin, Base):
    __tablename__ = "finance_applications"


    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    asset_id = Column(UUID(as_uuid=True), nullable=True) # Adjust when asset table exists
    requested_amount = Column(Numeric(18, 4), nullable=False)
    down_payment = Column(Numeric(18, 4), nullable=False, default=0)
    tenure_months = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="DRAFT") # DRAFT/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED
    notes = Column(Text, nullable=True)

    customer = relationship("User")
