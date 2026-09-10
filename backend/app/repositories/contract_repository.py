from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base_repository import BaseRepository
from app.models.contract import Contract

class ContractRepository(BaseRepository[Contract]):
    def __init__(self, session: AsyncSession):
        super().__init__(Contract, session)
