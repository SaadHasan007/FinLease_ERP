from sqlalchemy import Column, String, Integer, Numeric, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, AuditMixin

class Contract(AuditMixin, Base):
    __tablename__ = "contracts"


    application_id = Column(UUID(as_uuid=True), ForeignKey("finance_applications.id"), nullable=False)
    principal_amount = Column(Numeric(18, 4), nullable=False)
    interest_rate = Column(Numeric(5, 4), nullable=False)
    tenure_months = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="DRAFT") # DRAFT/ACTIVE/COMPLETED/DEFAULTED/TERMINATED
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    application = relationship("FinanceApplication")
