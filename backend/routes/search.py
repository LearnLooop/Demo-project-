from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional

from database import get_db
from db.models import Course
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
    Perform a simple text search over available Courses.
    """
    if not q or len(q.strip()) < 2:
        return []
        
    search_term = f"%{q.strip()}%"
    
    # Search Courses
    stmt = select(Course).where(
        or_(
            Course.title.ilike(search_term),
            Course.description.ilike(search_term)
        ),
        Course.published == True
    )
    
    res = await db.execute(stmt)
    courses = res.scalars().all()
    
    results = []
    for c in courses:
        results.append(SearchResult(
            type="course",
            id=c.id,
            title=c.title,
            description=c.description,
            metadata={"level": c.level.value if hasattr(c.level, 'value') else c.level}
        ))
        
    return results
