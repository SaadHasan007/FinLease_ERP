from pydantic import BaseModel, ConfigDict
from typing import Optional
import datetime
from uuid import UUID

class NotificationBase(BaseModel):
    user_id: UUID
    title: str
    message: str
    is_read: bool = False
    notification_type: str

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationResponse(NotificationBase):
    id: UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)
