from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base_repository import BaseRepository
from app.models.payment import PaymentSchedule

class PaymentRepository(BaseRepository[PaymentSchedule]):
    def __init__(self, session: AsyncSession):
        super().__init__(PaymentSchedule, session)
