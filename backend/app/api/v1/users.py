"""User management API endpoints."""
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_role
from app.models.user import User
from app.schemas.common import MessageResponse, SuccessResponse
from app.schemas.user import (
    RolesAssignRequest,
    UserCreateRequest,
    UserResponse,
    UserUpdateRequest,
)
from app.services.audit_service import AuditService
from app.services.user_service import UserService

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse,
    dependencies=[Depends(require_role(["SUPER_ADMIN", "MANAGER"]))],
)
async def list_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List all users (Admin/Manager only)."""
    service = UserService(db)
    offset = (page - 1) * limit
    users = await service.list_users(offset=offset, limit=limit)
    total = await service.count_users()
    return {
        "success": True,
        "data": [UserResponse.model_validate(u).model_dump() for u in users],
        "meta": {"page": page, "limit": limit, "total": total, "total_pages": -(-total // limit)},
    }


@router.post(
    "",
    response_model=SuccessResponse,
    status_code=201,
    dependencies=[Depends(require_role(["SUPER_ADMIN"]))],
)
async def create_user(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Create a new user (Admin only)."""
    service = UserService(db)
    user = await service.create_user(data, created_by=current_user.id)
    await AuditService.log(
        action="USER_CREATE",
        entity_name="user",
        entity_id=user.id,
        performed_by=current_user.id,
        new_values={"email": user.email, "roles": user.role_names},
    )
    return {
        "success": True,
        "data": UserResponse.model_validate(user).model_dump(),
    }


@router.get(
    "/{user_id}",
    response_model=SuccessResponse,
    dependencies=[Depends(require_role(["SUPER_ADMIN", "MANAGER"]))],
)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get a user by ID (Admin/Manager only)."""
    service = UserService(db)
    user = await service.get_user(user_id)
    return {
        "success": True,
        "data": UserResponse.model_validate(user).model_dump(),
    }


@router.put(
    "/{user_id}",
    response_model=SuccessResponse,
    dependencies=[Depends(require_role(["SUPER_ADMIN"]))],
)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Update a user (Admin only)."""
    service = UserService(db)
    user = await service.update_user(user_id, data, updated_by=current_user.id)
    return {
        "success": True,
        "data": UserResponse.model_validate(user).model_dump(),
    }


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_role(["SUPER_ADMIN"]))],
)
async def deactivate_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Deactivate (soft-delete) a user (Admin only)."""
    service = UserService(db)
    await service.deactivate_user(user_id)
    await AuditService.log(
        action="USER_DEACTIVATE",
        entity_name="user",
        entity_id=user_id,
        performed_by=current_user.id,
    )
    return {"success": True, "message": "User deactivated successfully."}


@router.post(
    "/{user_id}/roles",
    response_model=SuccessResponse,
    dependencies=[Depends(require_role(["SUPER_ADMIN"]))],
)
async def assign_roles(
    user_id: uuid.UUID,
    data: RolesAssignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Assign roles to a user (Admin only)."""
    service = UserService(db)
    user = await service.assign_roles(user_id, data.role_names)
    await AuditService.log(
        action="ROLE_ASSIGN",
        entity_name="user",
        entity_id=user_id,
        performed_by=current_user.id,
        new_values={"roles": data.role_names},
    )
    return {
        "success": True,
        "data": UserResponse.model_validate(user).model_dump(),
    }
