"""User-related Pydantic schemas."""
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class RoleResponse(BaseModel):
    """Role representation in API responses."""
    id: uuid.UUID
    name: str
    description: str | None = None

    model_config = {"from_attributes": True}


class PermissionResponse(BaseModel):
    """Permission representation in API responses."""
    id: uuid.UUID
    code: str
    description: str | None = None
    module: str

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    """User representation in API responses."""
    id: uuid.UUID
    email: EmailStr
    first_name: str
    last_name: str
    phone: str | None = None
    status: str
    roles: list[RoleResponse] = []
    last_login_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreateRequest(BaseModel):
    """Admin user creation request."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    role_names: list[str] = Field(default=["CUSTOMER"])
    branch_id: uuid.UUID | None = None


class UserUpdateRequest(BaseModel):
    """User update request."""
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    status: str | None = None
    branch_id: uuid.UUID | None = None


class RolesAssignRequest(BaseModel):
    """Assign roles to a user."""
    role_names: list[str] = Field(min_length=1)
