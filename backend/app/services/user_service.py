"""User management service."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException, ValidationException
from app.core.logging_config import get_logger
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import RoleRepository, UserRepository
from app.schemas.user import UserCreateRequest, UserUpdateRequest

logger = get_logger("user_service")


class UserService:
    """Handles user CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)
        self.role_repo = RoleRepository(session)

    async def create_user(self, data: UserCreateRequest, created_by: uuid.UUID | None = None) -> User:
        """Create a new user (admin operation)."""
        if await self.user_repo.email_exists(data.email):
            raise ConflictException(
                message=f"Email '{data.email}' is already registered.",
                code="USER_002",
            )

        roles = await self.role_repo.get_by_names(data.role_names)
        if len(roles) != len(data.role_names):
            found = {r.name for r in roles}
            missing = set(data.role_names) - found
            raise ValidationException(
                message=f"Roles not found: {', '.join(missing)}",
                code="ROLE_001",
            )

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            branch_id=data.branch_id,
            created_by=created_by,
        )
        user.roles = roles
        return await self.user_repo.create(user)

    async def get_user(self, user_id: uuid.UUID) -> User:
        """Get a user by ID."""
        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user:
            raise NotFoundException("User", user_id)
        return user

    async def list_users(self, offset: int = 0, limit: int = 20) -> list[User]:
        """List all users."""
        return await self.user_repo.get_all(offset=offset, limit=limit)

    async def update_user(
        self,
        user_id: uuid.UUID,
        data: UserUpdateRequest,
        updated_by: uuid.UUID | None = None,
    ) -> User:
        """Update user fields."""
        user = await self.get_user(user_id)
        update_data = data.model_dump(exclude_unset=True)
        if updated_by:
            update_data["updated_by"] = updated_by
        for key, value in update_data.items():
            setattr(user, key, value)
        await self.session.flush()
        await self.session.refresh(user)
        logger.info("User updated: %s by %s", user_id, updated_by)
        return user

    async def deactivate_user(self, user_id: uuid.UUID) -> bool:
        """Soft-delete (deactivate) a user."""
        user = await self.get_user(user_id)
        user.status = "INACTIVE"
        await self.user_repo.soft_delete(user_id)
        logger.info("User deactivated: %s", user_id)
        return True

    async def assign_roles(
        self, user_id: uuid.UUID, role_names: list[str]
    ) -> User:
        """Replace user's roles with the specified role names."""
        user = await self.get_user(user_id)
        roles = await self.role_repo.get_by_names(role_names)
        if len(roles) != len(role_names):
            found = {r.name for r in roles}
            missing = set(role_names) - found
            raise ValidationException(
                message=f"Roles not found: {', '.join(missing)}",
                code="ROLE_001",
            )
        user.roles = roles
        await self.session.flush()
        await self.session.refresh(user)
        logger.info("Roles assigned to user %s: %s", user_id, role_names)
        return user

    async def count_users(self) -> int:
        """Count total active users."""
        return await self.user_repo.count()
