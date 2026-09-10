from enum import Enum as PyEnum

from sqlalchemy.orm import Mapped
from sqlalchemy import Column, String, Enum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid

from app.models.base import Base, AuditMixin

class CustomerType(str, PyEnum):
    INDIVIDUAL = "INDIVIDUAL"
    CORPORATE = "CORPORATE"

class CustomerStatus(str, PyEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    BLACKLISTED = "BLACKLISTED"

class RiskCategory(str, PyEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"

class Customer(AuditMixin, Base):
    __tablename__ = "customers"


    customer_type: Mapped[str] = Column(Enum(CustomerType), nullable=False)  # type: ignore
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    company_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    status: Mapped[str] = Column(Enum(CustomerStatus), default=CustomerStatus.ACTIVE, nullable=False)  # type: ignore
    risk_category: Mapped[str] = Column(Enum(RiskCategory), default=RiskCategory.MEDIUM, nullable=False)  # type: ignore
