from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.models.customer import CustomerType, CustomerStatus, RiskCategory

class CustomerBase(BaseModel):
    customer_type: CustomerType
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    status: CustomerStatus = CustomerStatus.ACTIVE
    risk_category: RiskCategory = RiskCategory.MEDIUM

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    customer_type: Optional[CustomerType] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[CustomerStatus] = None
    risk_category: Optional[RiskCategory] = None

class CustomerResponse(CustomerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
