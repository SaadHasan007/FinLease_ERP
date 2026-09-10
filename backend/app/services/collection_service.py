from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.repositories.collection_repository import CollectionCaseRepository, CollectionActionRepository
from app.schemas.collection import CollectionCaseCreate, CollectionCaseUpdate, CollectionActionCreate, CollectionActionUpdate
from app.models.collection import CollectionCase, CollectionAction

class CollectionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.case_repo = CollectionCaseRepository(session)
        self.action_repo = CollectionActionRepository(session)

    async def create_case(self, case_in: CollectionCaseCreate) -> CollectionCase:
        return await self.case_repo.create(case_in.model_dump())

    async def get_case(self, case_id: int) -> Optional[CollectionCase]:
        return await self.case_repo.get(case_id)

    async def get_all_cases(self) -> List[CollectionCase]:
        return await self.case_repo.get_all()

    async def update_case(self, case_id: int, case_in: CollectionCaseUpdate) -> Optional[CollectionCase]:
        return await self.case_repo.update(case_id, case_in.model_dump(exclude_unset=True))

    async def delete_case(self, case_id: int) -> bool:
        return await self.case_repo.delete(case_id)

    async def create_action(self, action_in: CollectionActionCreate) -> CollectionAction:
        return await self.action_repo.create(action_in.model_dump())

    async def get_action(self, action_id: int) -> Optional[CollectionAction]:
        return await self.action_repo.get(action_id)

    async def get_all_actions(self) -> List[CollectionAction]:
        return await self.action_repo.get_all()
