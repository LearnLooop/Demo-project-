from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import json

from database import get_db
from db.models import Message as DBMessage, User, Enrollment, Course
from utils.auth import get_current_user, verify_token

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

class MessageSend(BaseModel):
    recipient_id: str
    message: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    recipient_id: str
    message: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class ContactResponse(BaseModel):
    id: str
    name: str
    role: str
    avatar: str = None

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        user_data = verify_token(token)
        user_id = user_data.user_id
    except Exception:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            # We receive text mostly to keep connection alive or manual triggers
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get list of users you can chat with - based on course relationships, with fallback"""
    from db.models import UserRole as DBUserRole
    
    if current_user.role == "student":
        # Get instructors of enrolled courses
        stmt = (
            select(User)
            .join(Course, Course.instructor_id == User.id)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .where(Enrollment.user_id == current_user.user_id)
        )
        res = await db.execute(stmt)
        users = res.scalars().unique().all()
        
        # Fallback: if no contacts found, return all instructors
        if not users:
            stmt_all = select(User).where(User.role == DBUserRole.INSTRUCTOR)
            res_all = await db.execute(stmt_all)
            users = res_all.scalars().all()
    else:
        # Instructors get students enrolled in their courses
        stmt = (
            select(User)
            .join(Enrollment, Enrollment.user_id == User.id)
            .join(Course, Course.id == Enrollment.course_id)
            .where(Course.instructor_id == current_user.user_id)
        )
        res = await db.execute(stmt)
        users = res.scalars().unique().all()
        
        # Fallback: if no enrolled students found, return all students
        if not users:
            stmt_all = select(User).where(User.role == DBUserRole.STUDENT)
            res_all = await db.execute(stmt_all)
            users = res_all.scalars().all()

    # Exclude self
    users = [u for u in users if u.id != current_user.user_id]

    return [
        ContactResponse(id=u.id, name=u.name, role=u.role.value, avatar=u.avatar)
        for u in users
    ]

@router.get("/history/{contact_id}", response_model=List[MessageResponse])
async def get_message_history(
    contact_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(DBMessage).where(
        or_(
            and_(DBMessage.sender_id == current_user.user_id, DBMessage.recipient_id == contact_id),
            and_(DBMessage.sender_id == contact_id, DBMessage.recipient_id == current_user.user_id)
        )
    ).order_by(DBMessage.created_at.asc())
    
    res = await db.execute(stmt)
    messages = res.scalars().all()
    
    return [
        MessageResponse(
            id=m.id, sender_id=m.sender_id, recipient_id=m.recipient_id,
            message=m.message, created_at=m.created_at
        ) for m in messages
    ]

@router.post("/send", response_model=MessageResponse)
async def send_message(
    payload: MessageSend,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_msg = DBMessage(
        sender_id=current_user.user_id,
        recipient_id=payload.recipient_id,
        subject="Chat",
        message=payload.message
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)
    
    msg_dict = {
        "id": new_msg.id,
        "sender_id": new_msg.sender_id,
        "recipient_id": new_msg.recipient_id,
        "message": new_msg.message,
        "created_at": new_msg.created_at.isoformat()
    }
    
    # Push to recipient if online
    await manager.send_personal_message(msg_dict, payload.recipient_id)
    
    return msg_dict
