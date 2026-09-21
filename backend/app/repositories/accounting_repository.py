from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List
from app.repositories.base_repository import BaseRepository
from app.models.accounting import Account, JournalEntry

class AccountRepository(BaseRepository[Account]):
    def __init__(self, session: AsyncSession):
        super().__init__(Account, session)

class JournalEntryRepository(BaseRepository[JournalEntry]):
    def __init__(self, session: AsyncSession):
        super().__init__(JournalEntry, session)

    async def get_all_with_lines(self, offset: int = 0, limit: int = 100) -> List[JournalEntry]:
        stmt = (
            select(JournalEntry)
            .where(JournalEntry.is_deleted == False)
            .options(selectinload(JournalEntry.lines))
            .order_by(desc(JournalEntry.created_at))
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
