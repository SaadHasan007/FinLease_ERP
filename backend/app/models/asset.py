from enum import Enum as PyEnum

from sqlalchemy.orm import Mapped
from sqlalchemy import Column, String, Integer, Numeric, Enum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid

from app.models.base import Base, AuditMixin

class AssetCategory(str, PyEnum):
    VEHICLE = "VEHICLE"
    EQUIPMENT = "EQUIPMENT"
    REAL_ESTATE = "REAL_ESTATE"

class AssetStatus(str, PyEnum):
    AVAILABLE = "AVAILABLE"
    ALLOCATED = "ALLOCATED"
    MAINTENANCE = "MAINTENANCE"
    SOLD = "SOLD"

class Asset(AuditMixin, Base):
    __tablename__ = "assets"


    category: Mapped[str] = Column(Enum(AssetCategory), nullable=False)
    make = Column(String(255), nullable=True)
    model_name = Column(String(255), nullable=True)
    year = Column(Integer, nullable=True)
    serial_number = Column(String(255), unique=True, index=True, nullable=False)
    status: Mapped[str] = Column(Enum(AssetStatus), default=AssetStatus.AVAILABLE, nullable=False)
    current_value = Column(Numeric(18, 4), nullable=False)
