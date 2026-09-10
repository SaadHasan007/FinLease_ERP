from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate
from app.repositories.asset_repository import AssetRepository

class AssetService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = AssetRepository(Asset, session)

    async def get(self, id: UUID) -> Optional[Asset]:
        return await self.repository.get_by_id( id)

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[Asset]:
        return await self.repository.get_all( skip=skip, limit=limit)

    async def create(self, obj_in: AssetCreate) -> Asset:
        return await self.repository.create( obj_in=obj_in)

    async def update(self, db_obj: Asset, obj_in: AssetUpdate) -> Asset:
        return await self.repository.update( db_obj=db_obj, obj_in=obj_in)

    async def delete(self, id: UUID) -> Optional[Asset]:
        return await self.repository.delete( id=id)

