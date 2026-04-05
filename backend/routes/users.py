from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from typing import Optional

from database import get_db
from db.models import User
from utils.auth import get_current_user, hash_password, verify_password
from schemas import UserResponse, UserSettings

router = APIRouter()

# Schemas for incoming updates not defined in main schemas.py
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == current_user.user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return UserResponse(
        user_id=user.id, email=user.email, name=user.name,
        role=user.role.value, avatar=user.avatar, bio=user.bio,
        created_at=user.created_at
    )

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    updates: ProfileUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == current_user.user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    
    if updates.name is not None: user.name = updates.name
    if updates.avatar is not None: user.avatar = updates.avatar
    if updates.bio is not None: user.bio = updates.bio
        
    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        user_id=user.id, email=user.email, name=user.name,
        role=user.role.value, avatar=user.avatar, bio=user.bio,
        created_at=user.created_at
    )

@router.get("/settings", response_model=UserSettings)
async def get_settings(current_user = Depends(get_current_user)):
    """Mocked settings view until dedicated relational table is mapped."""
    return UserSettings()
    
@router.put("/settings", response_model=UserSettings)
async def update_settings(
    settings: UserSettings, 
    current_user = Depends(get_current_user)
):
    """Mocked setting update returning the updated input."""
    return settings

@router.put("/password")
async def update_password(
    payload: PasswordUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == current_user.user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return {"status": "success", "message": "Password updated successfully"}
