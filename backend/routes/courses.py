from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List, Optional

from schemas import Course as CourseSchema, CourseCreate, CourseUpdate
from db.models import Course, Enrollment, Unit, Chapter
from utils.auth import get_current_user, get_current_instructor
from database import get_db

router = APIRouter()

@router.post("/", response_model=CourseSchema, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate, 
    current_user = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Create a new course (instructors only)"""
    new_course = Course(
        instructor_id=current_user.user_id,
        title=course_data.title,
        description=course_data.description,
        level=course_data.level,
        duration=course_data.duration,
        enrollment_cap=course_data.enrollment_cap,
        adaptive_enabled=course_data.adaptive_enabled,
        auto_remediation=course_data.auto_remediation,
        grade_gate=course_data.grade_gate
    )
    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)

    # Force bypass SQLAlchemy asynchronous lazy loader lock
    course_dict = {
        col.name: getattr(new_course, col.name) for col in new_course.__table__.columns
    }
    course_dict["units"] = []
    
    return CourseSchema(**course_dict)

@router.get("/", response_model=List[CourseSchema])
async def get_courses(
    published_only: bool = Query(True),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all courses"""
    stmt = select(Course).options(selectinload(Course.units).selectinload(Unit.chapters))
    
    if published_only and current_user.role != "instructor":
        stmt = stmt.where(Course.published == True)
    elif current_user.role == "instructor":
        stmt = stmt.where(Course.instructor_id == current_user.user_id)
        
    result = await db.execute(stmt)
    courses = result.scalars().all()
    
    return [CourseSchema.model_validate(c) for c in courses]

@router.get("/{course_id}", response_model=CourseSchema)
async def get_course(
    course_id: str, 
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific course"""
    stmt = select(Course).options(selectinload(Course.units).selectinload(Unit.chapters)).where(Course.id == course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    return CourseSchema.model_validate(course)

@router.put("/{course_id}", response_model=CourseSchema)
async def update_course(
    course_id: str,
    updates: CourseUpdate,
    current_user = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Update a course (instructors only)"""
    stmt = select(Course).where(Course.id == course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    if course.instructor_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(course, key, value)
        
    await db.commit()
    await db.refresh(course)
    
    stmt = select(Course).options(selectinload(Course.units).selectinload(Unit.chapters)).where(Course.id == course_id)
    result = await db.execute(stmt)
    course = result.scalar_one()
    
    return CourseSchema.model_validate(course)

@router.delete("/{course_id}")
async def delete_course(
    course_id: str, 
    current_user = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Delete a course"""
    stmt = select(Course).where(Course.id == course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    if course.instructor_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    await db.delete(course)
    await db.commit()
    return {"message": "Course deleted successfully"}

@router.post("/{course_id}/enroll")
async def enroll_course(
    course_id: str, 
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enroll in a course"""
    stmt = select(Course).where(Course.id == course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    stmt = select(Enrollment).where(
        Enrollment.user_id == current_user.user_id,
        Enrollment.course_id == course_id
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already enrolled")
        
    enrollment = Enrollment(
        user_id=current_user.user_id,
        course_id=course_id,
        progress=0.0
    )
    db.add(enrollment)
    await db.commit()
    return {"message": "Enrolled successfully"}
