from pydantic import BaseModel, ConfigDict
from typing import Optional
import datetime

class NotificationBase(BaseModel):
    user_id: int
    title: str
    message: str
    is_read: bool = False
    notification_type: str

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationResponse(NotificationBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)
