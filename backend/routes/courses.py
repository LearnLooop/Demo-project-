from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from schemas import Course as CourseSchema, CourseCreate, CourseUpdate
from db.models import Course, Enrollment, Unit, Chapter, CourseRating
from utils.auth import get_current_user, get_current_instructor
from database import get_db

class RatingPayload(BaseModel):
    rating: int  # 1-5
    review: str = ""

async def attach_ratings_and_counts(db, courses_dicts, user_id):
    """Attach average_rating, rating_count, enrollment_count, and user_rating to course dicts."""
    course_ids = [c['id'] for c in courses_dicts]
    if not course_ids:
        return courses_dicts
    
    # Enrollment counts
    enroll_stmt = select(
        Enrollment.course_id, func.count(Enrollment.id)
    ).where(Enrollment.course_id.in_(course_ids)).group_by(Enrollment.course_id)
    enroll_res = await db.execute(enroll_stmt)
    enroll_counts = dict(enroll_res.all())
    
    # Rating aggregates
    rating_stmt = select(
        CourseRating.course_id, func.avg(CourseRating.rating), func.count(CourseRating.id)
    ).where(CourseRating.course_id.in_(course_ids)).group_by(CourseRating.course_id)
    rating_res = await db.execute(rating_stmt)
    rating_aggs = {r[0]: (round(float(r[1]), 1), r[2]) for r in rating_res.all()}
    
    # User's own ratings
    user_rating_stmt = select(
        CourseRating.course_id, CourseRating.rating
    ).where(CourseRating.course_id.in_(course_ids), CourseRating.user_id == user_id)
    user_rating_res = await db.execute(user_rating_stmt)
    user_ratings = dict(user_rating_res.all())
    
    for c_dict in courses_dicts:
        cid = c_dict['id']
        c_dict['enrollment_count'] = enroll_counts.get(cid, 0)
        if cid in rating_aggs:
            c_dict['average_rating'] = rating_aggs[cid][0]
            c_dict['rating_count'] = rating_aggs[cid][1]
        c_dict['user_rating'] = user_ratings.get(cid)
    
    return courses_dicts

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
        grade_gate=course_data.grade_gate,
        materials_link=course_data.materials_link,
        google_classroom_link=course_data.google_classroom_link,
        google_meet_link=course_data.google_meet_link
    )
    db.add(new_course)
    await db.flush()  # Generate new_course.id before referencing it
    # Handle chaptersData
    if hasattr(course_data, 'chaptersData') and course_data.chaptersData is not None:
        # Create a default unit to hold chapters
        default_unit = Unit(
            course_id=new_course.id,
            title="Default Unit",
            order_index=0
        )
        db.add(default_unit)
        await db.flush()  # to get default_unit.id
        
        # Create Chapters
        for idx, ch_data in enumerate(course_data.chaptersData):
            chapter = Chapter(
                unit_id=default_unit.id,
                title=ch_data.get('title', 'Untitled Chapter'),
                type=ch_data.get('type', 'video'),
                duration=ch_data.get('duration', ''),
                content=ch_data.get('content', ''),
                video_url=ch_data.get('video_url', ''),
                order_index=idx
            )
            db.add(chapter)
            
        await db.commit()
    else:
        await db.commit()

    await db.refresh(new_course)

    stmt = select(Course).options(selectinload(Course.units).selectinload(Unit.chapters)).where(Course.id == new_course.id)
    result = await db.execute(stmt)
    full_course = result.scalar_one()

    return CourseSchema.model_validate(full_course)

@router.get("/", response_model=List[CourseSchema])
async def get_courses(
    published_only: bool = Query(True),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all courses"""
    stmt = select(Course).options(selectinload(Course.units).selectinload(Unit.chapters))
    
    is_instructor = str(getattr(current_user, 'role', '')) == "instructor"
    
    if published_only and not is_instructor:
        stmt = stmt.where(Course.published == True)
    elif is_instructor:
        stmt = stmt.where(Course.instructor_id == current_user.user_id)
        
    result = await db.execute(stmt)
    courses = result.scalars().all()
    
    # Attach enrollment progress for the current user
    enroll_stmt = select(Enrollment).where(Enrollment.user_id == current_user.user_id)
    enroll_res = await db.execute(enroll_stmt)
    enrollments = {e.course_id: e.progress for e in enroll_res.scalars().all()}
    
    response_dicts = []
    for c in courses:
        c_dict = CourseSchema.model_validate(c).model_dump()
        if c.id in enrollments:
            c_dict["progress"] = enrollments[c.id]
            c_dict["is_enrolled"] = True
        response_dicts.append(c_dict)
    
    await attach_ratings_and_counts(db, response_dicts, current_user.user_id)
    response = [CourseSchema(**d) for d in response_dicts]
        
    return response

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
        
    # Attach enrollment progress
    enroll_stmt = select(Enrollment).where(
        Enrollment.user_id == current_user.user_id,
        Enrollment.course_id == course_id
    )
    enroll_res = await db.execute(enroll_stmt)
    existing_enrollment = enroll_res.scalar_one_or_none()
    
    c_dict = CourseSchema.model_validate(course).model_dump()
    
    is_instructor = str(getattr(current_user, 'role', '')) == "instructor"
    
    if existing_enrollment:
        c_dict["progress"] = existing_enrollment.progress
        c_dict["is_enrolled"] = True
        completed_chapters = existing_enrollment.completed_chapters or []
    else:
        completed_chapters = []
        
    has_access = is_instructor or existing_enrollment
    
    if not has_access:
        c_dict["materials_link"] = None
        c_dict["google_classroom_link"] = None
        c_dict["google_meet_link"] = None

    for unit in c_dict.get('units', []):
        for chapter in unit.get('chapters', []):
            if not has_access:
                chapter['content'] = None
                chapter['video_url'] = None
            chapter['completed'] = chapter['id'] in completed_chapters
    
    await attach_ratings_and_counts(db, [c_dict], current_user.user_id)
            
    return CourseSchema(**c_dict)

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
    chapters_data = update_data.pop('chaptersData', None)

    for key, value in update_data.items():
        setattr(course, key, value)
        
    await db.flush()

    if chapters_data is not None:
        # Get or create default unit
        stmt_unit = select(Unit).where(Unit.course_id == course_id).order_by(Unit.order_index)
        res_unit = await db.execute(stmt_unit)
        default_unit = res_unit.scalars().first()
        
        if not default_unit:
            default_unit = Unit(course_id=course_id, title="Default Unit", order_index=0)
            db.add(default_unit)
            await db.flush()
            
        # Delete existing chapters in this unit to replace with new ones
        delete_stmt = delete(Chapter).where(Chapter.unit_id == default_unit.id)
        await db.execute(delete_stmt)
        
        for idx, ch_data in enumerate(chapters_data):
            # We don't save DB-unsupported fields or handle nested quizzes deep insert here to keep it simple,
            # but we save title, type, duration, content which covers 90% of structural editing.
            new_ch = Chapter(
                id=ch_data.get('id') if ch_data.get('id') and not str(ch_data.get('id')).startswith('ch-') else None,
                unit_id=default_unit.id,
                title=ch_data.get('title', 'Untitled Chapter'),
                type=ch_data.get('type', 'video'),
                duration=ch_data.get('duration', ''),
                content=ch_data.get('content', ''),
                video_url=ch_data.get('video_url', ''),
                order_index=idx
            )
            # if the ID was a temporary frontend string, we let DB generate a new uuid
            if new_ch.id is None:
                db.add(new_ch)
            else:
                db.add(new_ch)

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
        progress=0.0,
        completed_chapters=[]
    )
    db.add(enrollment)
    await db.commit()
    return {"message": "Enrolled successfully"}

@router.post("/{course_id}/chapters/{chapter_id}/complete")
async def complete_chapter(
    course_id: str,
    chapter_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Enrollment).where(
        Enrollment.user_id == current_user.user_id,
        Enrollment.course_id == course_id
    )
    res = await db.execute(stmt)
    enrollment = res.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled")
        
    completed = list(enrollment.completed_chapters or [])
    if chapter_id not in completed:
        completed.append(chapter_id)
        enrollment.completed_chapters = completed
        
        # Recalculate progress
        course_stmt = select(Course).options(selectinload(Course.units).selectinload(Unit.chapters)).where(Course.id == course_id)
        c_res = await db.execute(course_stmt)
        course = c_res.scalar_one()
        all_chapters = [ch for u in course.units for ch in u.chapters]
        
        if all_chapters:
            enrollment.progress = min(100.0, (len(completed) / len(all_chapters)) * 100.0)
        
        await db.commit()
        
    return {"message": "Chapter marked as complete", "progress": enrollment.progress}

@router.post("/{course_id}/rate")
async def rate_course(
    course_id: str,
    payload: RatingPayload,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Rate a course (enrolled students only)"""
    # Verify enrollment
    stmt = select(Enrollment).where(
        Enrollment.user_id == current_user.user_id,
        Enrollment.course_id == course_id
    )
    res = await db.execute(stmt)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Must be enrolled to rate")
    
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    
    # Check for an existing rating
    existing_stmt = select(CourseRating).where(
        CourseRating.user_id == current_user.user_id,
        CourseRating.course_id == course_id
    )
    existing_res = await db.execute(existing_stmt)
    existing = existing_res.scalar_one_or_none()
    
    if existing:
        existing.rating = payload.rating
        existing.review = payload.review
    else:
        new_rating = CourseRating(
            user_id=current_user.user_id,
            course_id=course_id,
            rating=payload.rating,
            review=payload.review
        )
        db.add(new_rating)
    
    await db.commit()
    return {"message": "Rating saved successfully", "rating": payload.rating}
