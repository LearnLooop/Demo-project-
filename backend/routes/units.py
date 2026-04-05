from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from schemas import Unit as UnitSchema, UnitCreate, UnitUpdate
from db.models import Unit, Course
from utils.auth import get_current_instructor
from database import get_db

router = APIRouter()

@router.post("/", response_model=UnitSchema, status_code=status.HTTP_201_CREATED)
async def create_unit(
    unit_data: UnitCreate, 
    current_user = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Course).where(Course.id == unit_data.course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course or course.instructor_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    stmt = select(Unit).where(Unit.course_id == unit_data.course_id)
    result = await db.execute(stmt)
    existing_units = result.scalars().all()
    order_index = len(existing_units)
    
    new_unit = Unit(
        course_id=unit_data.course_id,
        title=unit_data.title,
        description=unit_data.description,
        order_index=order_index
    )
    db.add(new_unit)
    await db.commit()
    await db.refresh(new_unit)
    
    return UnitSchema.model_validate(new_unit)

@router.delete("/{unit_id}")
async def delete_unit(
    unit_id: str, 
    current_user = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Unit).where(Unit.id == unit_id)
    result = await db.execute(stmt)
    unit = result.scalar_one_or_none()
    
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        
    stmt = select(Course).where(Course.id == unit.course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course or course.instructor_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    await db.delete(unit)
    await db.commit()
    return {"message": "Unit deleted"}
