from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from db.models import Competency, UserCompetencyProgress
from schemas import Competency as CompetencySchema
from utils.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[CompetencySchema])
async def get_user_competencies(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all competency progress for the current user"""
    # Fetch all user progress items and join with competency details
    stmt = select(UserCompetencyProgress, Competency).\
           join(Competency, UserCompetencyProgress.competency_id == Competency.id).\
           where(UserCompetencyProgress.user_id == current_user.user_id)
    
    result = await db.execute(stmt)
    records = result.all()
    
    competencies = []
    for progress, comp in records:
        competencies.append(CompetencySchema(
            id=comp.id,
            name=comp.name,
            category=comp.category,
            mastery=progress.mastery_level
        ))
        
    return competencies

@router.get("/all", response_model=List[CompetencySchema])
async def get_all_competencies(
    db: AsyncSession = Depends(get_db)
):
    """Get all available competencies in the library"""
    result = await db.execute(select(Competency))
    comps = result.scalars().all()
    
    return [
        CompetencySchema(id=c.id, name=c.name, category=c.category, mastery=0.0) 
        for c in comps
    ]
