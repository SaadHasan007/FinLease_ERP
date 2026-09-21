"""Generic base repository providing CRUD operations."""
import uuid
from typing import Any, Generic, Type, TypeVar

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic async CRUD repository."""

    def __init__(self, model: Type[ModelType], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def get_by_id(self, entity_id: uuid.UUID | str) -> ModelType | None:
        """Retrieve a single entity by ID, excluding soft-deleted."""
        if isinstance(entity_id, str):
            try:
                entity_id = uuid.UUID(entity_id)
            except ValueError:
                return None
        result = await self.session.execute(
            select(self.model).where(
                self.model.id == entity_id,  # type: ignore
                self.model.is_deleted == False,  # noqa: E712  # type: ignore
            )
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        offset: int = 0,
        limit: int = 20,
        filters: list | None = None,
        skip: int | None = None,
        **kwargs: Any,
    ) -> list[ModelType]:
        """Retrieve all entities with optional filtering and pagination."""
        if skip is not None:
            offset = skip
        query = select(self.model).where(
            self.model.is_deleted == False  # noqa: E712  # type: ignore
        )
        if filters:
            for f in filters:
                query = query.where(f)
        query = query.offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count(self, filters: list | None = None) -> int:
        """Count entities matching filters."""
        query = select(func.count(self.model.id)).where(  # type: ignore
            self.model.is_deleted == False  # noqa: E712  # type: ignore
        )
        if filters:
            for f in filters:
                query = query.where(f)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def create(self, entity: ModelType) -> ModelType:
        """Persist a new entity."""
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update_fields(
        self, entity_id: uuid.UUID | str, fields: dict[str, Any]
    ) -> ModelType | None:
        """Update specific fields on an entity."""
        entity = await self.get_by_id(entity_id)
        if entity is None:
            return None
        for key, value in fields.items():
            setattr(entity, key, value)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def soft_delete(self, entity_id: uuid.UUID | str) -> bool:
        """Soft-delete an entity."""
        from datetime import datetime, timezone
        entity = await self.get_by_id(entity_id)
        if entity is None:
            return False
        entity.is_deleted = True  # type: ignore
        entity.deleted_at = datetime.now(timezone.utc)  # type: ignore
        await self.session.flush()
        return True
