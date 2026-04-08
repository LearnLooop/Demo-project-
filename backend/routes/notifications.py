from fastapi import APIRouter, Depends
from typing import List, Optional
from datetime import datetime
import uuid

from schemas import Notification
from utils.auth import get_current_user
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from db.models import Message

router = APIRouter()

@router.get("/", response_model=List[Notification])
async def get_notifications(
    unread_only: bool = False,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch notifications based on actual messages sent to the user.
    """
    stmt = select(Message).where(Message.recipient_id == current_user.user_id)
    if unread_only:
        stmt = stmt.where(Message.read == False)
        
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    notifications = []
    for m in messages:
        notifications.append(
            Notification(
                id=m.id,
                user_id=m.recipient_id,
                title=m.subject,
                message=m.message,
                type="info",
                read=m.read,
                created_at=m.created_at
            )
        )
        
    return notifications

@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Message).where(Message.id == notification_id, Message.recipient_id == current_user.user_id)
    res = await db.execute(stmt)
    msg = res.scalar_one_or_none()
    if msg:
        msg.read = True
        await db.commit()
    return {"status": "success", "message": "Notification marked as read"}

@router.put("/mark-all-read")
async def mark_all_read(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = update(Message).where(Message.recipient_id == current_user.user_id, Message.read == False).values(read=True)
    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Message).where(Message.id == notification_id, Message.recipient_id == current_user.user_id)
    res = await db.execute(stmt)
    msg = res.scalar_one_or_none()
    if msg:
        await db.delete(msg)
        await db.commit()
    return {"status": "success", "message": "Notification deleted"}
