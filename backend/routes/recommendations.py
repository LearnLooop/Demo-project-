from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import uuid

from database import get_db
from db.models import UserCompetencyProgress, Chapter, Competency, chapter_competency, Course
from schemas import Recommendation, Priority
from utils.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Recommendation])
async def get_recommendations(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Adaptive Engine: Scans user competencies for values below safe thresholds (< 60.0),
    cross-references them mapped against Course Chapters, and returns 
    a custom curriculum of remedial material for the user to review.
    """
    # 1. Fetch failing competencies
    weak_threshold = 60.0
    stmt = select(UserCompetencyProgress, Competency).\
           join(Competency, UserCompetencyProgress.competency_id == Competency.id).\
           where(UserCompetencyProgress.user_id == current_user.user_id,
                 UserCompetencyProgress.mastery_level < weak_threshold)
                 
    result = await db.execute(stmt)
    weak_comps = result.all()
    
    recommendations = []
    
    # Generate recommendations for each weak competency
    for progress, comp in weak_comps:
        # Find chapters that teach this competency
        ch_stmt = select(Chapter, Course.id, Course.title).\
                  join(Course, Course.units.any(id=Chapter.unit_id)).\
                  join(chapter_competency, chapter_competency.c.chapter_id == Chapter.id).\
                  where(chapter_competency.c.competency_id == comp.id)
                  
        try:
            # We must jump through chapter -> unit -> course in standard SQL. 
            # In SQLAlchemy, it's easier to join Course over Chapter.unit_id.
            from db.models import Unit
            ch_stmt_correct = select(Chapter, Course).\
                join(Unit, Chapter.unit_id == Unit.id).\
                join(Course, Unit.course_id == Course.id).\
                join(chapter_competency, chapter_competency.c.chapter_id == Chapter.id).\
                where(chapter_competency.c.competency_id == comp.id)
                
            ch_res = await db.execute(ch_stmt_correct)
            chapters_found = ch_res.all()
            
            for chapter, course in chapters_found:
                rec_priority = Priority.HIGH if progress.mastery_level < 40 else Priority.MEDIUM
                
                recommendations.append(Recommendation(
                    id=str(uuid.uuid4()),
                    user_id=current_user.user_id,
                    chapter_id=chapter.id,
                    chapter_title=chapter.title,
                    course_id=course.id,
                    course_title=course.title,
                    reason=f"Review required to improve your mastery in {comp.name}",
                    estimated_time=int(chapter.duration.split()[0]) if chapter.duration and chapter.duration.split()[0].isdigit() else 15,
                    related_competency=comp.name,
                    current_mastery=progress.mastery_level,
                    expected_mastery=80.0,
                    priority=rec_priority,
                    created_at=datetime.utcnow()
                ))
        except Exception as e:
            continue
            
    return recommendations
    
@router.post("/refresh")
async def refresh_recommendations(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Placeholder to force a recalculation, currently returning static response since recommendations are calculated dynamically upon GET"""
    return {"status": "success", "message": "Recommendations refreshed"}
