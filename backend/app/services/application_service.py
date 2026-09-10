from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import FinanceApplication
from app.schemas.application import FinanceApplicationCreate, FinanceApplicationUpdate
from app.repositories.application_repository import ApplicationRepository

class ApplicationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = ApplicationRepository(session)

    async def get(self, id: UUID) -> Optional[FinanceApplication]:
        return await self.repository.get_by_id(id)

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[FinanceApplication]:
        return await self.repository.get_all(offset=skip, limit=limit)

    async def create(self, obj_in: FinanceApplicationCreate) -> FinanceApplication:
        obj = FinanceApplication(**obj_in.model_dump())
        return await self.repository.create(obj)

    async def update(self, id: UUID, obj_in: FinanceApplicationUpdate) -> Optional[FinanceApplication]:
        return await self.repository.update_fields(id, obj_in.model_dump(exclude_unset=True))

    async def delete(self, id: UUID) -> bool:
        return await self.repository.soft_delete(id)
