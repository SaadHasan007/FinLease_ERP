"""Authentication API endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
)
from app.schemas.common import MessageResponse, SuccessResponse
from app.schemas.user import UserResponse
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=SuccessResponse, status_code=201)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Register a new user account."""
    service = AuthService(db)
    user = await service.register(data)
    await AuditService.log(
        action="USER_REGISTER",
        entity_name="user",
        entity_id=user.id,
        new_values={"email": user.email, "roles": user.role_names},
    )
    return {
        "success": True,
        "data": UserResponse.model_validate(user).model_dump(),
    }


@router.post("/login", response_model=SuccessResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Authenticate and receive JWT tokens."""
    service = AuthService(db)
    tokens = await service.login(data)
    await AuditService.log(
        action="USER_LOGIN",
        entity_name="user",
        new_values={"email": data.email},
    )
    return {"success": True, "data": tokens.model_dump()}


@router.post("/refresh", response_model=SuccessResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Refresh access token using a valid refresh token."""
    service = AuthService(db)
    tokens = await service.refresh_access_token(data.refresh_token)
    return {"success": True, "data": tokens.model_dump()}


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Logout current user (client should discard tokens)."""
    await AuditService.log(
        action="USER_LOGOUT",
        entity_name="user",
        entity_id=current_user.id,
        performed_by=current_user.id,
    )
    return {"success": True, "message": "Logged out successfully."}


@router.get("/me", response_model=SuccessResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get current authenticated user's profile."""
    return {
        "success": True,
        "data": UserResponse.model_validate(current_user).model_dump(),
    }
