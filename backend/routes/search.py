from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional

from database import get_db
from db.models import Course, Chapter, Unit, User, UserRole
from schemas import SearchResult
from utils.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[SearchResult])
async def search_content(
    q: Optional[str] = "",
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Perform a text search over published Courses, Chapters, and Users (students).
    """
    if not q or len(q.strip()) < 2:
        return []

    search_term = f"%{q.strip()}%"
    results = []

    # Search published Courses
    course_stmt = select(Course).where(
        or_(
            Course.title.ilike(search_term),
            Course.description.ilike(search_term),
        ),
        Course.published == True,
    )
    course_res = await db.execute(course_stmt)
    for c in course_res.scalars().all():
        results.append(SearchResult(
            type="course",
            id=c.id,
            title=c.title,
            description=c.description,
            metadata={"level": c.level.value if hasattr(c.level, "value") else c.level},
        ))

    # Search Chapters (in published courses)
    chapter_stmt = (
        select(Chapter, Course.title.label("course_title"), Course.id.label("course_id"))
        .join(Unit, Chapter.unit_id == Unit.id)
        .join(Course, Unit.course_id == Course.id)
        .where(
            Chapter.title.ilike(search_term),
            Course.published == True,
        )
    )
    chapter_res = await db.execute(chapter_stmt)
    for chapter, course_title, course_id in chapter_res.all():
        results.append(SearchResult(
            type="chapter",
            id=chapter.id,
            title=chapter.title,
            description=None,
            metadata={"course_id": course_id, "course_title": course_title, "type": chapter.type.value if hasattr(chapter.type, "value") else chapter.type},
        ))

    # Search Students by name or email (instructors and admins only)
    if current_user.role in ("instructor", "admin"):
        user_stmt = select(User).where(
            or_(
                User.name.ilike(search_term),
                User.email.ilike(search_term),
            ),
            User.role == UserRole.STUDENT,
        )
        user_res = await db.execute(user_stmt)
        for u in user_res.scalars().all():
            results.append(SearchResult(
                type="student",
                id=u.id,
                title=u.name,
                description=u.email,
                metadata={"role": u.role.value if hasattr(u.role, "value") else u.role},
            ))

    return results
