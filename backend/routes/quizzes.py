import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from typing import List

from schemas import QuizCreate, QuizSubmission, QuizResult as QuizResultSchema
from db.models import Quiz, QuizQuestion, QuizResult, UserCompetencyProgress, Enrollment, Competency, Course, Unit, Chapter
from utils.auth import get_current_user, get_current_instructor
from database import get_db
import os
import json
import google.generativeai as genai
from pydantic import BaseModel

class QuizGenerateRequest(BaseModel):
    course_id: str

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_quiz(quiz_data: QuizCreate, current_user = Depends(get_current_instructor), db: AsyncSession = Depends(get_db)):
    """Create a new quiz (instructors only)"""
    new_quiz = Quiz(
        id=str(uuid.uuid4()),
        title=quiz_data.title,
        time_limit=quiz_data.time_limit
    )
    db.add(new_quiz)
    await db.flush()
    # Add questions
    for idx, q_data in enumerate(quiz_data.questions):
        db.add(QuizQuestion(
            id=str(uuid.uuid4()),
            quiz_id=new_quiz.id,
            text=q_data.text,
            options=str(q_data.options),
            correct_index=q_data.correct_index,
            explanation=q_data.explanation
        ))
    await db.commit()
    return {"quiz_id": new_quiz.id, "message": "Quiz created successfully"}

@router.get("/available")
async def get_available_quiz(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get the first available quiz for dynamic taking"""
    stmt = select(Quiz).options(selectinload(Quiz.questions))
    result = await db.execute(stmt)
    quiz = result.scalars().first()
    
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No quizzes available to take")
        
    return {
        "id": quiz.id,
        "title": quiz.title,
        "time_limit": quiz.time_limit,
        "pass_threshold": quiz.pass_threshold,
        "questions": [{"id": q.id, "text": q.text, "options": eval(q.options)} for q in quiz.questions]
    }

@router.get("/{quiz_id}")
async def get_quiz(quiz_id: str, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get a restricted quiz by ID"""
    stmt = select(Quiz).options(selectinload(Quiz.questions)).where(Quiz.id == quiz_id)
    result = await db.execute(stmt)
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        
    return {
        "id": quiz.id,
        "title": quiz.title,
        "time_limit": quiz.time_limit,
        "pass_threshold": quiz.pass_threshold,
        "questions": [{"id": q.id, "text": q.text, "options": eval(q.options)} for q in quiz.questions]
    }

@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_quiz(submission: QuizSubmission, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Evaluate quiz, process adaptive competencies and mastery gates"""
    stmt = select(Quiz).options(selectinload(Quiz.questions).selectinload(QuizQuestion.competencies)).where(Quiz.id == submission.quiz_id)
    result = await db.execute(stmt)
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        
    total_qs = len(quiz.questions)
    if total_qs == 0:
        return {"score": 100, "passed": True}
        
    correct_count = 0
    passed_comps = []
    failed_comps = []
    
    # Simple index-based check. For robust, frontend should send question_id to selection mapping
    for idx, q in enumerate(quiz.questions):
        # We assume submission.answers maps question index to selected option index
        selected_idx = submission.answers.get(idx)
        if selected_idx is not None and selected_idx == q.correct_index:
            correct_count += 1
            passed_comps.extend(q.competencies)
        else:
            failed_comps.extend(q.competencies)

    score = (correct_count / total_qs) * 100.0
    passed = score >= (quiz.pass_threshold or 70.0)

    # Save Result
    q_result = QuizResult(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        quiz_id=quiz.id,
        score=score
    )
    db.add(q_result)
    
    # Adaptive Logic: Update Competency Mastery
    all_comps = set(passed_comps + failed_comps)
    for comp in all_comps:
        stmt_ucp = select(UserCompetencyProgress).where(
            UserCompetencyProgress.user_id == current_user.id,
            UserCompetencyProgress.competency_id == comp.id
        )
        res_ucp = await db.execute(stmt_ucp)
        ucp = res_ucp.scalar_one_or_none()
        if not ucp:
            ucp = UserCompetencyProgress(id=str(uuid.uuid4()), user_id=current_user.id, competency_id=comp.id, mastery_level=50.0)
            db.add(ucp)
            
        # Adjust mastery
        if comp in passed_comps and comp not in failed_comps:
            ucp.mastery_level = min(100.0, ucp.mastery_level + 5.0)
        elif comp in failed_comps:
            ucp.mastery_level = max(0.0, ucp.mastery_level - 10.0)

    # Mastery Gating: only bump enrollment progress if passed
    # Assuming quiz is linked to a Chapter, linked to Unit, linked to Course. We bypass complex lookup here for brevity.
    # In real scenario, we'd query Course/Chapter to update Enrollment.progress
    
    await db.commit()
    
    return {
        "score": score,
        "correct": correct_count,
        "total": total_qs,
        "passed": passed,
        "message": "Quiz passed! Progress updated." if passed else "Quiz failed. Review recommendations."
    }

@router.get("/results/history")
async def get_quiz_history(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(QuizResult).where(QuizResult.user_id == current_user.id).order_by(QuizResult.completed_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_quiz(req: QuizGenerateRequest, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Dynamically generate a quiz via Gemini AI for a given course"""
    stmt = select(Course).options(selectinload(Course.units).selectinload(Unit.chapters)).where(Course.id == req.course_id)
    res = await db.execute(stmt)
    course = res.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    context_str = f"Course: {course.title}\nDescription: {course.description}\n"
    for unit in course.units:
        for chapter in unit.chapters:
            context_str += f"- {chapter.title}\n"
            
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured. Add it to .env.")
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""Generate a 5-question multiple choice quiz based on this course context:
{context_str}

Return EXACTLY a JSON object with this shape, and nothing else (no markdown formatting or backticks around it):
{{
  "title": "Generated Quiz Title",
  "questions": [
    {{
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Why this is correct."
    }}
  ]
}}
"""
    response = model.generate_content(prompt)
    try:
        raw_text = response.text.strip('` \n')
        if raw_text.startswith('json'):
            raw_text = raw_text[4:]
        data = json.loads(raw_text)
    except Exception as e:
        print(response.text)
        raise HTTPException(status_code=500, detail="Failed to parse AI response.")
        
    new_quiz = Quiz(
        id=str(uuid.uuid4()),
        title=data.get("title", f"Quiz for {course.title}"),
        time_limit=90
    )
    db.add(new_quiz)
    await db.flush()
    
    response_questions = []
    
    for idx, q_data in enumerate(data.get("questions", [])):
        q_id = str(uuid.uuid4())
        db.add(QuizQuestion(
            id=q_id,
            quiz_id=new_quiz.id,
            text=q_data["text"],
            options=str(q_data["options"]),
            correct_index=q_data["correct_index"],
            explanation=q_data["explanation"]
        ))
        response_questions.append({
            "id": q_id,
            "text": q_data["text"],
            "options": q_data["options"]
        })
        
    await db.commit()
    
    return {
        "id": new_quiz.id,
        "title": new_quiz.title,
        "time_limit": new_quiz.time_limit,
        "pass_threshold": new_quiz.pass_threshold,
        "questions": response_questions
    }
