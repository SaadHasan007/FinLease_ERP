from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base_repository import BaseRepository
from app.models.asset import Asset

class AssetRepository(BaseRepository[Asset]):
    def __init__(self, session: AsyncSession):
        super().__init__(Asset, session)

    async def get_by_serial_number(self, serial_number: str) -> Asset | None:
        """Find asset by serial number."""
        result = await self.session.execute(
            select(Asset).where(Asset.serial_number == serial_number, Asset.is_deleted == False)  # noqa: E712
        )
        return result.scalar_one_or_none()
