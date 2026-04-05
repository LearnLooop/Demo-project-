from fastapi import APIRouter, Depends
from typing import List, Optional
from datetime import datetime
import uuid

from schemas import Notification
from utils.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Notification])
async def get_notifications(
    unread_only: bool = False,
    current_user = Depends(get_current_user)
):
    """
    Mocked notifications endpoint. Since we deprecated the notifications
    collection in MongoDB pending a relational migration, we will return 
    a small friendly mocked payload to keep the UI bell functioning correctly.
    """
    notifications = [
        Notification(
            id=str(uuid.uuid4()),
            user_id=current_user.user_id,
            title="Welcome to CourseWeaver!",
            message="Your adaptive learning journey begins here. Try exploring the catalog.",
            type="info",
            read=False,
            created_at=datetime.utcnow()
        ),
        Notification(
            id=str(uuid.uuid4()),
            user_id=current_user.user_id,
            title="Competency Updated",
            message="Your mastery in 'Variables & Types' has increased globally.",
            type="success",
            read=True,
            created_at=datetime.utcnow()
        )
    ]
    
    if unread_only:
        return [n for n in notifications if not n.read]
    return notifications

@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    """Mocks marking a single notification as read"""
    return {"status": "success", "message": "Notification marked as read"}

@router.put("/mark-all-read")
async def mark_all_read(
    current_user = Depends(get_current_user)
):
    """Mocks marking all as read"""
    return {"status": "success", "message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    """Mocks dismissing a notification"""
    return {"status": "success", "message": "Notification deleted"}
