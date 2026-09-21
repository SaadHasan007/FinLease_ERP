from typing import Optional, List
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.application import ApplicationDecision, FinanceApplication
from app.schemas.application import FinanceApplicationCreate, FinanceApplicationUpdate
from app.repositories.application_repository import ApplicationRepository

class ApplicationService:
    VALID_TRANSITIONS = {
        "DRAFT": {"UNDER_REVIEW"},
        "UNDER_REVIEW": {"APPROVED", "REJECTED"},
        "APPROVED": set(),
        "REJECTED": set(),
    }
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = ApplicationRepository(session)

    async def get(self, id: UUID) -> Optional[FinanceApplication]:
        return await self.repository.get_by_id(id)

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[FinanceApplication]:
        return await self.repository.get_all(offset=skip, limit=limit)

    async def create(self, obj_in: FinanceApplicationCreate) -> FinanceApplication:
        values = obj_in.model_dump(exclude={"status"})
        obj = FinanceApplication(**values, status="DRAFT")
        return await self.repository.create(obj)

    async def update(self, id: UUID, obj_in: FinanceApplicationUpdate) -> Optional[FinanceApplication]:
        return await self.repository.update_fields(id, obj_in.model_dump(exclude_unset=True))

    async def decide(self, id: UUID, new_status: str, reason: str, decided_by: UUID) -> tuple[FinanceApplication | None, ApplicationDecision | None]:
        application = await self.repository.get_by_id(id)
        if application is None:
            return None, None
        reason = reason.strip()
        if not reason:
            raise ValueError("A decision reason is required")
        if new_status not in self.VALID_TRANSITIONS.get(application.status, set()):
            raise ValueError(f"Cannot transition application from {application.status} to {new_status}")

        decision = ApplicationDecision(
            application_id=application.id,
            previous_status=application.status,
            new_status=new_status,
            reason=reason,
            decided_by=decided_by,
            decided_at=datetime.now(timezone.utc),
        )
        application.status = new_status
        application.updated_by = decided_by
        self.session.add(decision)
        await self.session.flush()
        await self.session.refresh(application)
        await self.session.refresh(decision)
        return application, decision

    async def decisions(self, id: UUID) -> list[ApplicationDecision]:
        result = await self.session.execute(
            select(ApplicationDecision)
            .where(ApplicationDecision.application_id == id)
            .order_by(ApplicationDecision.decided_at.desc())
        )
        return list(result.scalars().all())

    async def delete(self, id: UUID) -> bool:
        return await self.repository.soft_delete(id)
