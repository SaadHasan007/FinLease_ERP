"""FastAPI dependency injection — auth, DB session, RBAC."""
import uuid
from typing import Callable

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token
from app.db.session import get_async_session
from app.models.user import User


async def get_db(session: AsyncSession = Depends(get_async_session)) -> AsyncSession:  # type: ignore[misc]
    """Dependency that yields an async DB session."""
    yield session


async def get_current_user(
    authorization: str = Header(..., description="Bearer <access_token>"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current user from the Authorization header."""
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header format.")

    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type.")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Token missing subject.")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError as e:
        raise UnauthorizedException("Invalid user ID in token.") from e

    result = await db.execute(
        select(User)
        .options(selectinload(User.roles))
        .where(User.id == user_id, User.is_deleted == False)  # noqa: E712
    )
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User not found or deactivated.")
    if user.status != "ACTIVE":
        raise UnauthorizedException(f"User account is {user.status.lower()}.")

    return user


def require_role(allowed_roles: list[str]) -> Callable:
    """Factory that returns a dependency checking if the user has one of the allowed roles."""

    async def _role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        user_role_names = current_user.role_names
        if "SUPER_ADMIN" in user_role_names:
            return current_user  # Super admin bypasses all role checks
        if not any(role in user_role_names for role in allowed_roles):
            raise ForbiddenException(
                f"This action requires one of: {', '.join(allowed_roles)}"
            )
        return current_user

    return _role_checker
