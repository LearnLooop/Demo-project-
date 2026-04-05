import asyncio
import uuid
from datetime import datetime
from sqlalchemy import select
from database import async_session_maker
from db.models import (
    User, Course, Unit, Chapter, Competency, 
    Enrollment, UserCompetencyProgress, QuizResult, ChapterType, Quiz
)
from schemas import CourseLevel

def gen_id(): return str(uuid.uuid4())

async def seed_database():
    async with async_session_maker() as session:
        # Check if users exist yet
        res = await session.execute(select(User))
        users = res.scalars().all()
        if not users:
            print("Please run `python create_user.py` first to generate the accounts!")
            return
            
        student = next((u for u in users if u.role.value == "student"), None)
        instructor = next((u for u in users if u.role.value == "instructor"), None)
        
        if not student or not instructor:
            print("Student or Instructor not found!")
            return

        # 1. Create Competencies
        c1 = Competency(id=gen_id(), name="Variables & Data Types", category="Programming")
        c2 = Competency(id=gen_id(), name="React Hooks", category="Frontend")
        c3 = Competency(id=gen_id(), name="State Management", category="Frontend")
        c4 = Competency(id=gen_id(), name="Memory Complexity", category="Computer Science")
        session.add_all([c1, c2, c3, c4])
        
        # 2. Create Courses
        course1 = Course(
            id=gen_id(), 
            title="Advanced React Patterns",
            description="Master React hooks, custom state management tools, and render optimizations strictly geared towards production applications.",
            instructor_id=instructor.id,
            level=CourseLevel.ADVANCED,
            duration="14 hours",
            published=True
        )
        course2 = Course(
            id=gen_id(), 
            title="Algorithms & Memory",
            description="A deep dive into Big-O notation, Time vs Space boundaries, and optimal graph traversal architecture.",
            instructor_id=instructor.id,
            level=CourseLevel.INTERMEDIATE,
            duration="22 hours",
            published=True
        )
        session.add_all([course1, course2])
        
        # 3. Create Units & Chapters
        # Course 1 Units
        u1 = Unit(id=gen_id(), course_id=course1.id, title="The Mechanics of State", order_index=1)
        u2 = Unit(id=gen_id(), course_id=course1.id, title="Rendering Trees", order_index=2)
        session.add_all([u1, u2])
        
        ch1 = Chapter(id=gen_id(), unit_id=u1.id, title="useState vs useReducer", type=ChapterType.READING, duration="15 mins", order_index=1)
        ch2 = Chapter(id=gen_id(), unit_id=u1.id, title="Complex Architectures", type=ChapterType.VIDEO, duration="20 mins", order_index=2)
        # Map competencies
        ch1.competencies.append(c3)
        ch2.competencies.append(c2)
        session.add_all([ch1, ch2])
        
        # Course 2 Units
        u3 = Unit(id=gen_id(), course_id=course2.id, title="Big-O Foundation", order_index=1)
        session.add(u3)
        ch3 = Chapter(id=gen_id(), unit_id=u3.id, title="Space Complexity Traps", type=ChapterType.READING, duration="45 mins", order_index=1)
        ch3.competencies.append(c4)
        session.add(ch3)
        
        # 4. Enroll Student
        enroll1 = Enrollment(user_id=student.id, course_id=course1.id, progress=45.0, enrolled_at=datetime.utcnow())
        enroll2 = Enrollment(user_id=student.id, course_id=course2.id, progress=12.0, enrolled_at=datetime.utcnow())
        session.add_all([enroll1, enroll2])
        
        # 5. Populate Student Progress (Synthetic Failures for Adaptive Engine triggering)
        prog1 = UserCompetencyProgress(user_id=student.id, competency_id=c1.id, mastery_level=85.0)
        prog2 = UserCompetencyProgress(user_id=student.id, competency_id=c2.id, mastery_level=65.0)
        # Synthetic failure triggering < 60 threshold
        prog3 = UserCompetencyProgress(user_id=student.id, competency_id=c3.id, mastery_level=22.0)
        # Synthetic extreme failure triggering < 40 At-Risk indicator
        prog4 = UserCompetencyProgress(user_id=student.id, competency_id=c4.id, mastery_level=15.0)
        session.add_all([prog1, prog2, prog3, prog4])
        
        # 6. Mock Quiz Results
        qZ = Quiz(id=gen_id(), title="Memory Basics", time_limit=120, pass_threshold=70.0)
        session.add(qZ)
        
        qres1 = QuizResult(
            id=gen_id(), user_id=student.id, quiz_id=qZ.id, 
            score=45.0, completed_at=datetime.utcnow()
        )
        session.add(qres1)

        await session.commit()
        print("Database seamlessly seeded with highly customized platform data!")

if __name__ == "__main__":
    asyncio.run(seed_database())
