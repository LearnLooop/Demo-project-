from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime

from database import get_db
from db.models import User, Enrollment, Course, UserCompetencyProgress, Competency
from schemas import StudentInfo, RiskLevel
from utils.auth import get_current_instructor

router = APIRouter()

@router.get("/", response_model=List[StudentInfo])
async def get_all_students(
    risk_filter: Optional[str] = None,
    current_instructor = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch all unique students enrolled in any course created by the instructor.
    Constructs the StudentInfo footprint including weakened competencies and RiskLevel.
    """
    # 1. Get instructor's course IDs
    stmt_courses = select(Course.id).where(Course.instructor_id == current_instructor.user_id)
    courses_res = await db.execute(stmt_courses)
    course_ids = [c[0] for c in courses_res.all()]
    
    if not course_ids:
        return []

    # 2. Find enrolled users
    stmt_enrollments = select(Enrollment, User).\
                       join(User, Enrollment.user_id == User.id).\
                       where(Enrollment.course_id.in_(course_ids))
    enroll_res = await db.execute(stmt_enrollments)
    records = enroll_res.all()
    
    # We might have duplicates if a student is enrolled in multiple courses for the same instructor, so deduplicate.
    student_map = {}
    for enroll, user in records:
        if user.id not in student_map:
            student_map[user.id] = {
                "user": user,
                "total_progress": enroll.progress,
                "count": 1,
                "last_active": enroll.last_accessed or enroll.enrolled_at
            }
        else:
            student_map[user.id]["total_progress"] += enroll.progress
            student_map[user.id]["count"] += 1
            if enroll.last_accessed and student_map[user.id]["last_active"] < enroll.last_accessed:
                student_map[user.id]["last_active"] = enroll.last_accessed
                
    # 3. Pull their competencies to calculate Risk
    student_ids = list(student_map.keys())
    comps_stmt = select(UserCompetencyProgress, Competency.name).\
                 join(Competency, UserCompetencyProgress.competency_id == Competency.id).\
                 where(UserCompetencyProgress.user_id.in_(student_ids))
    comps_res = await db.execute(comps_stmt)
    comps = comps_res.all()
    
    user_comps = {sid: {} for sid in student_ids}
    user_weakest = {sid: ("None", 100.0) for sid in student_ids}
    
    for prog, comp_name in comps:
        user_comps[prog.user_id][prog.competency_id] = prog.mastery_level
        if prog.mastery_level < user_weakest[prog.user_id][1]:
            user_weakest[prog.user_id] = (comp_name, prog.mastery_level)
            
    response_payload = []
    
    for sid, data in student_map.items():
        user = data["user"]
        avg_prog = data["total_progress"] / data["count"]
        weak_name, weak_score = user_weakest[sid]
        
        # Calculate Risk
        if weak_score < 40.0:
            risk = RiskLevel.HIGH
        elif weak_score < 60.0 or avg_prog < 40.0:
            risk = RiskLevel.MODERATE
        else:
            risk = RiskLevel.GOOD
            
        if risk_filter and risk.value != risk_filter:
            continue
            
        time_since = int((datetime.utcnow() - data["last_active"]).days) if data["last_active"] else 0
            
        response_payload.append(StudentInfo(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar=user.avatar,
            risk_level=risk,
            progress=avg_prog,
            weakest_competency=weak_name,
            weekly_time=max(0, 10 - time_since), # arbitrary dummy metric for "hours spent"
            last_active=data["last_active"].strftime("%Y-%m-%d") if data["last_active"] else "Never",
            competencies=user_comps[sid]
        ))
        
    return response_payload

@router.get("/at-risk/list")
async def get_at_risk_students(
    current_instructor = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Convenience endpoint calling the same logic but forcing HIGH risk"""
    return await get_all_students(risk_filter=RiskLevel.HIGH.value, current_instructor=current_instructor, db=db)
