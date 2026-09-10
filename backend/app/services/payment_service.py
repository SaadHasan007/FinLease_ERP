from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import PaymentSchedule
from app.schemas.payment import PaymentScheduleCreate, PaymentScheduleUpdate
from app.repositories.payment_repository import PaymentRepository

class PaymentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = PaymentRepository(session)

    async def get(self, id: UUID) -> Optional[PaymentSchedule]:
        return await self.repository.get_by_id(id)

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[PaymentSchedule]:
        return await self.repository.get_all(offset=skip, limit=limit)

    async def create(self, obj_in: PaymentScheduleCreate) -> PaymentSchedule:
        obj = PaymentSchedule(**obj_in.model_dump())
        return await self.repository.create(obj)

    async def update(self, id: UUID, obj_in: PaymentScheduleUpdate) -> Optional[PaymentSchedule]:
        return await self.repository.update_fields(id, obj_in.model_dump(exclude_unset=True))

    async def delete(self, id: UUID) -> bool:
        return await self.repository.soft_delete(id)
