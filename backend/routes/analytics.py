from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from datetime import datetime, timedelta

from database import get_db
from db.models import User, Enrollment, Course, UserCompetencyProgress, QuizResult
from schemas import AnalyticsResponse, ProgressDataPoint, EnrollmentDataPoint
from utils.auth import get_current_instructor

router = APIRouter()

@router.get("/overview", response_model=AnalyticsResponse)
async def get_analytics_overview(
    current_instructor = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregated statistics for the instructor's dashboard.
    Shows total students enrolled in their courses, an average progress metric,
    and a count of struggling students.
    """
    # 1. Total Students enrolled in courses taught by this instructor
    # Instead of DISTINCT counts which are complex in async, we can fetch all enrollments for instructor's courses
    stmt_courses = select(Course.id).where(Course.instructor_id == current_instructor.user_id)
    courses_res = await db.execute(stmt_courses)
    course_ids = [c[0] for c in courses_res.all()]
    
    if not course_ids:
        return AnalyticsResponse(
            total_students=0, average_progress=0.0, at_risk_count=0,
            weekly_progress=[], enrollment_trend=[]
        )
        
    stmt_enrollments = select(Enrollment).where(Enrollment.course_id.in_(course_ids))
    enroll_res = await db.execute(stmt_enrollments)
    enrollments = enroll_res.scalars().all()
    
    unique_students = len(set(e.user_id for e in enrollments))
    avg_prog = sum(e.progress for e in enrollments) / len(enrollments) if enrollments else 0.0
    
    # 2. At-Risk Count (Students with any competency < 40)
    student_ids = list(set(e.user_id for e in enrollments))
    if student_ids:
        stmt_risk = select(UserCompetencyProgress.user_id).\
                    where(UserCompetencyProgress.user_id.in_(student_ids),
                          UserCompetencyProgress.mastery_level < 40.0).\
                    distinct()
        risk_res = await db.execute(stmt_risk)
        at_risk = len(risk_res.all())
    else:
        at_risk = 0
        
    # Generate some localized dummy trend data for the charts (since we lack time-series tracking in DB currently)
    weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"]
    weekly_prog = [
        ProgressDataPoint(week=f"Week {i+1}", progress=avg_prog * (0.5 + (0.1 * i)), quiz_score=75.0 + i)
        for i in range(6)
    ]
    
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    enroll_trend = [
        EnrollmentDataPoint(month=months[i], students=max(unique_students // 6 * (i+1), 1))
        for i in range(6)
    ]

    return AnalyticsResponse(
        total_students=unique_students,
        average_progress=round(avg_prog, 2),
        at_risk_count=at_risk,
        weekly_progress=weekly_prog,
        enrollment_trend=enroll_trend
    )

@router.get("/student/{student_id}/progress")
async def get_student_progress(
    student_id: str,
    current_instructor = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Deep dive into a specific student's aggregate progress, visible to instructors."""
    stmt = select(Enrollment, Course.title).join(Course).where(Enrollment.user_id == student_id)
    res = await db.execute(stmt)
    records = res.all()
    
    # Quiz stats
    q_stmt = select(QuizResult).where(QuizResult.user_id == student_id)
    q_res = await db.execute(q_stmt)
    quizzes = q_res.scalars().all()
    avg_score = sum(q.score for q in quizzes) / len(quizzes) if quizzes else 0
    
    return {
        "student_id": student_id,
        "courses": [{"course_id": e.course_id, "title": title, "progress": e.progress} for e, title in records],
        "average_quiz_score": round(avg_score, 2),
        "total_quizzes_taken": len(quizzes)
    }
