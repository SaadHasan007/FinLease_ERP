"""User repository — data access for User, Role, Permission."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User, Role
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """Data access layer for User entities."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> User | None:
        """Find a user by email address."""
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.roles))
            .where(User.email == email, User.is_deleted == False)  # noqa: E712
        )
        return result.scalar_one_or_none()

    async def get_by_id_with_roles(self, user_id: uuid.UUID) -> User | None:
        """Get user with eagerly loaded roles."""
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.roles))
            .where(User.id == user_id, User.is_deleted == False)  # noqa: E712
        )
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        """Check if an email is already registered."""
        user = await self.get_by_email(email)
        return user is not None


class RoleRepository(BaseRepository[Role]):
    """Data access layer for Role entities."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Role, session)

    async def get_by_name(self, name: str) -> Role | None:
        """Find a role by name."""
        result = await self.session.execute(
            select(Role).where(Role.name == name, Role.is_deleted == False)  # noqa: E712
        )
        return result.scalar_one_or_none()

    async def get_by_names(self, names: list[str]) -> list[Role]:
        """Find multiple roles by name."""
        result = await self.session.execute(
            select(Role).where(Role.name.in_(names), Role.is_deleted == False)  # noqa: E712
        )
        return list(result.scalars().all())
