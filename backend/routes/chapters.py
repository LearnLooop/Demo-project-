from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from schemas import Chapter as ChapterSchema, ChapterCreate, ChapterUpdate
from db.models import Chapter, Unit, Course
from utils.auth import get_current_instructor
from database import get_db

router = APIRouter()

@router.post("/", response_model=ChapterSchema, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    chapter_data: ChapterCreate, 
    current_user = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Unit).where(Unit.id == chapter_data.unit_id)
    result = await db.execute(stmt)
    unit = result.scalar_one_or_none()
    
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
        
    stmt = select(Course).where(Course.id == unit.course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course or course.instructor_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    stmt = select(Chapter).where(Chapter.unit_id == chapter_data.unit_id)
    result = await db.execute(stmt)
    existing = result.scalars().all()
    order_index = len(existing)
    
    new_chapter = Chapter(
        unit_id=chapter_data.unit_id,
        title=chapter_data.title,
        type=chapter_data.type,
        duration=chapter_data.duration,
        content=chapter_data.content,
        order_index=order_index
    )
    db.add(new_chapter)
    await db.commit()
    await db.refresh(new_chapter)
    
    return ChapterSchema.model_validate(new_chapter)

@router.delete("/{chapter_id}")
async def delete_chapter(
    chapter_id: str, 
    current_user = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Chapter).where(Chapter.id == chapter_id)
    result = await db.execute(stmt)
    chapter = result.scalar_one_or_none()
    
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        
    stmt = select(Unit).where(Unit.id == chapter.unit_id)
    result = await db.execute(stmt)
    unit = result.scalar_one_or_none()
    
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        
    stmt = select(Course).where(Course.id == unit.course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course or course.instructor_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    await db.delete(chapter)
    await db.commit()
    return {"message": "Chapter deleted"}
