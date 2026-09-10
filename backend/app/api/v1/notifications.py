from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.dependencies import get_db, require_role
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(notification_in: NotificationCreate, db: AsyncSession = Depends(get_db)):
    service = NotificationService(db)
    return await service.create_notification(notification_in)

@router.get("/", response_model=List[NotificationResponse])
async def get_all_notifications(db: AsyncSession = Depends(get_db)):
    service = NotificationService(db)
    return await service.get_all_notifications()

@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(notification_id: int, db: AsyncSession = Depends(get_db)):
    service = NotificationService(db)
    notification = await service.get_notification(notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(notification_id: int, notification_in: NotificationUpdate, db: AsyncSession = Depends(get_db)):
    service = NotificationService(db)
    notification = await service.update_notification(notification_id, notification_in)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification
