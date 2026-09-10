from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base_repository import BaseRepository
from app.models.application import FinanceApplication

class ApplicationRepository(BaseRepository[FinanceApplication]):
    def __init__(self, session: AsyncSession):
        super().__init__(FinanceApplication, session)
