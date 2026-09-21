from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from app.repositories.collection_repository import CollectionCaseRepository, CollectionActionRepository
from app.schemas.collection import CollectionCaseCreate, CollectionCaseUpdate, CollectionActionCreate, CollectionActionUpdate
from app.models.collection import CollectionCase, CollectionAction
from app.models.user import User

class CollectionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.case_repo = CollectionCaseRepository(session)
        self.action_repo = CollectionActionRepository(session)

    async def create_case(self, case_in: CollectionCaseCreate) -> CollectionCase:
        db_obj = CollectionCase(**case_in.model_dump())
        return await self.case_repo.create(db_obj)

    async def get_case(self, case_id: UUID) -> Optional[CollectionCase]:
        return await self.case_repo.get_by_id(case_id)

    async def get_all_cases(self) -> List[CollectionCase]:
        return await self.case_repo.get_all()

    async def update_case(self, case_id: UUID, case_in: CollectionCaseUpdate) -> Optional[CollectionCase]:
        return await self.case_repo.update_fields(case_id, case_in.model_dump(exclude_unset=True))

    async def delete_case(self, case_id: UUID) -> bool:
        return await self.case_repo.soft_delete(case_id)

    async def create_action(self, action_in: CollectionActionCreate) -> CollectionAction:
        data = action_in.model_dump()
        if not data.get("performed_by"):
            # Fetch first active user as fallback
            res = await self.session.execute(select(User.id).where(User.is_deleted == False).limit(1))
            user_id = res.scalar_one_or_none()
            data["performed_by"] = user_id
        db_obj = CollectionAction(**data)
        return await self.action_repo.create(db_obj)

    async def get_action(self, action_id: UUID) -> Optional[CollectionAction]:
        return await self.action_repo.get_by_id(action_id)

    async def get_all_actions(self) -> List[CollectionAction]:
        return await self.action_repo.get_all()
