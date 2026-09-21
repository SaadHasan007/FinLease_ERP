from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationCreate, NotificationUpdate
from app.models.notification import Notification

class NotificationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.notification_repo = NotificationRepository(session)

    async def create_notification(self, notification_in: NotificationCreate) -> Notification:
        db_obj = Notification(**notification_in.model_dump())
        return await self.notification_repo.create(db_obj)

    async def get_notification(self, notification_id: UUID) -> Optional[Notification]:
        return await self.notification_repo.get_by_id(notification_id)

    async def get_all_notifications(self) -> List[Notification]:
        return await self.notification_repo.get_all()

    async def update_notification(self, notification_id: UUID, notification_in: NotificationUpdate) -> Optional[Notification]:
        return await self.notification_repo.update_fields(notification_id, notification_in.model_dump(exclude_unset=True))

    async def delete_notification(self, notification_id: UUID) -> bool:
        return await self.notification_repo.soft_delete(notification_id)
