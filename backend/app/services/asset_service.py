from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate
from app.repositories.asset_repository import AssetRepository

class AssetService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = AssetRepository(session)

    async def get(self, id: UUID) -> Optional[Asset]:
        return await self.repository.get_by_id(id)

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[Asset]:
        return await self.repository.get_all(offset=skip, limit=limit)

    async def create(self, obj_in: AssetCreate) -> Asset:
        existing = await self.repository.get_by_serial_number(obj_in.serial_number)
        if existing:
            raise ConflictException(
                message=f"Asset with serial number '{obj_in.serial_number}' already exists.",
                code="ASSET_001",
            )
        db_obj = Asset(**obj_in.model_dump(exclude_unset=True))
        return await self.repository.create(entity=db_obj)

    async def update(self, id: UUID, obj_in: AssetUpdate) -> Optional[Asset]:
        db_obj = await self.get(id)
        if not db_obj:
            return None
        if obj_in.serial_number and obj_in.serial_number != db_obj.serial_number:
            existing = await self.repository.get_by_serial_number(obj_in.serial_number)
            if existing and existing.id != id:
                raise ConflictException(
                    message=f"Asset with serial number '{obj_in.serial_number}' already exists.",
                    code="ASSET_001",
                )
        for key, value in obj_in.model_dump(exclude_unset=True).items():
            setattr(db_obj, key, value)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, id: UUID) -> Optional[Asset]:
        db_obj = await self.get(id)
        if not db_obj:
            return None
        success = await self.repository.soft_delete(entity_id=id)
        return db_obj if success else None

