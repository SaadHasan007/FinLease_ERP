from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base_repository import BaseRepository
from app.models.collection import CollectionCase, CollectionAction

class CollectionCaseRepository(BaseRepository[CollectionCase]):
    def __init__(self, session: AsyncSession):
        super().__init__(CollectionCase, session)

class CollectionActionRepository(BaseRepository[CollectionAction]):
    def __init__(self, session: AsyncSession):
        super().__init__(CollectionAction, session)
