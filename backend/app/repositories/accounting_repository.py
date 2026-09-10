from app.repositories.base_repository import BaseRepository
from app.models.accounting import Account, JournalEntry

class AccountRepository(BaseRepository[Account]):
    def __init__(self):
        super().__init__(Account)

class JournalEntryRepository(BaseRepository[JournalEntry]):
    def __init__(self):
        super().__init__(JournalEntry)
