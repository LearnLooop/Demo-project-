import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from datetime import datetime
from dotenv import load_dotenv
from utils.auth import hash_password
from db.base import Base
from db.models import (
    User, UserRole, Course, CourseLevel, Unit, Chapter, ChapterType,
    Quiz, QuizQuestion, Enrollment, Competency, UserCompetencyProgress,
    chapter_competency, question_competency,
)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./courseweaver.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_async_engine(DATABASE_URL, echo=False, connect_args=connect_args)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed_database():
    """Create tables and seed the database with demo data."""
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        # ------ Users ------
        existing = await db.execute(
            __import__("sqlalchemy", fromlist=["select"]).select(User)
        )
        if existing.scalars().first():
            print("Database already seeded – skipping.")
            return

        student = User(
            id="u1",
            email="student@demo.com",
            password_hash=hash_password("demo"),
            name="Alex Johnson",
            role=UserRole.STUDENT,
        )
        instructor = User(
            id="u2",
            email="instructor@demo.com",
            password_hash=hash_password("demo"),
            name="Dr. Sarah Chen",
            role=UserRole.INSTRUCTOR,
            bio="Computer Science Professor with 10 years of teaching experience",
        )
        db.add_all([student, instructor])
        await db.flush()
        print("Created users")

        # ------ Competencies ------
        competency_data = [
            ("c1",  "Variables & Types",     "Fundamentals",   90.0),
            ("c2",  "Control Flow",           "Fundamentals",   78.0),
            ("c3",  "Functions",              "Core Concepts",  65.0),
            ("c4",  "Recursion",              "Core Concepts",  42.0),
            ("c5",  "Data Structures",        "Advanced",       55.0),
            ("c6",  "Algorithms",             "Advanced",       31.0),
            ("c7",  "OOP Basics",             "Core Concepts",  70.0),
            ("c8",  "Inheritance & Poly",     "Advanced",       48.0),
            ("c9",  "Error Handling",         "Core Concepts",  61.0),
            ("c10", "File I/O",               "Fundamentals",   82.0),
            ("c11", "Sorting Algorithms",     "Advanced",       35.0),
            ("c12", "Graph Theory",           "Advanced",       10.0),
            ("c13", "Dynamic Programming",    "Advanced",        0.0),
            ("c14", "Concurrency",            "Advanced",       20.0),
            ("c15", "Testing & Debugging",    "Professional",   72.0),
            ("c16", "Code Review & Style",    "Professional",   88.0),
        ]
        comps = {}
        for cid, name, category, mastery in competency_data:
            c = Competency(id=cid, name=name, category=category)
            db.add(c)
            comps[cid] = (c, mastery)
        await db.flush()

        # Student competency progress
        for cid, (comp, mastery) in comps.items():
            db.add(UserCompetencyProgress(
                user_id=student.id,
                competency_id=comp.id,
                mastery_level=mastery,
            ))
        await db.flush()
        print("Created competencies")

        # ------ Course 1: Intro to CS ------
        course1 = Course(
            id="course1",
            title="Introduction to Computer Science",
            description=(
                "Master the fundamental concepts of programming and computer science "
                "through hands-on projects and adaptive assessments."
            ),
            instructor_id=instructor.id,
            level=CourseLevel.BEGINNER,
            duration="8 weeks",
            published=True,
        )
        db.add(course1)
        await db.flush()

        unit1 = Unit(id="unit1", course_id=course1.id, title="Foundations", order_index=0)
        db.add(unit1)
        await db.flush()

        ch1 = Chapter(id="ch1", unit_id=unit1.id, title="Getting Started with Python",       type=ChapterType.VIDEO,   duration="45 min", order_index=0)
        ch2 = Chapter(id="ch2", unit_id=unit1.id, title="Variables, Types, and Operators",   type=ChapterType.READING, duration="30 min", order_index=1)
        ch3 = Chapter(id="ch3", unit_id=unit1.id, title="Control Flow Mastery",              type=ChapterType.VIDEO,   duration="50 min", order_index=2)
        ch4 = Chapter(id="ch4", unit_id=unit1.id, title="Functions and Scope",               type=ChapterType.VIDEO,   duration="40 min", order_index=3)
        ch5 = Chapter(id="ch5", unit_id=unit1.id, title="Recursion Deep Dive",               type=ChapterType.READING, duration="60 min", order_index=4)
        db.add_all([ch1, ch2, ch3, ch4, ch5])
        await db.flush()

        # Map chapters to competencies
        await db.execute(chapter_competency.insert(), [
            {"chapter_id": "ch1", "competency_id": "c1"},
            {"chapter_id": "ch1", "competency_id": "c2"},
            {"chapter_id": "ch2", "competency_id": "c1"},
            {"chapter_id": "ch3", "competency_id": "c2"},
            {"chapter_id": "ch4", "competency_id": "c3"},
            {"chapter_id": "ch5", "competency_id": "c4"},
        ])

        # Quiz for course 1
        import json as _json
        quiz1 = Quiz(id="quiz1", title="Core Concepts Quiz", time_limit=90, pass_threshold=70.0)
        db.add(quiz1)
        await db.flush()

        quiz_questions = [
            ("q1", "What is the time complexity of accessing an element by index in an array?",
             ["O(n)", "O(log n)", "O(1)", "O(n²)"], 2,
             "Array index access is O(1) because memory address is calculated directly.", "c5"),
            ("q2", "Which of the following correctly describes recursion?",
             ["A loop that runs a fixed number of times",
              "A function that calls itself directly or indirectly",
              "A data structure that holds function references",
              "A sorting algorithm"], 1,
             "Recursion is when a function calls itself to solve smaller subproblems.", "c4"),
            ("q3", "What does the 'stack' data structure follow?",
             ["FIFO", "LIFO", "Random Access", "Priority-based"], 1,
             "A stack follows Last In, First Out (LIFO).", "c5"),
            ("q4", "What is the base case in recursion used for?",
             ["To increase performance", "To allocate more memory",
              "To stop the recursive calls", "To define the function signature"], 2,
             "The base case stops recursion from running infinitely.", "c4"),
            ("q5", "Which sorting algorithm has an average time complexity of O(n log n)?",
             ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"], 2,
             "Merge Sort divides the array in halves (log n levels) and merges them.", "c11"),
        ]
        for qid, text, options, correct_idx, explanation, comp_id in quiz_questions:
            q = QuizQuestion(
                id=qid,
                quiz_id=quiz1.id,
                text=text,
                options=_json.dumps(options),
                correct_index=correct_idx,
                explanation=explanation,
            )
            db.add(q)
        await db.flush()

        await db.execute(question_competency.insert(), [
            {"question_id": "q1", "competency_id": "c5"},
            {"question_id": "q2", "competency_id": "c4"},
            {"question_id": "q3", "competency_id": "c5"},
            {"question_id": "q4", "competency_id": "c4"},
            {"question_id": "q5", "competency_id": "c11"},
        ])

        ch6 = Chapter(id="ch6", unit_id=unit1.id, title="Quiz: Core Concepts", type=ChapterType.QUIZ, duration="20 min", order_index=5, quiz_id=quiz1.id)
        db.add(ch6)
        await db.flush()

        # ------ Course 2: Data Structures & Algorithms ------
        course2 = Course(
            id="course2",
            title="Data Structures & Algorithms",
            description="Deep dive into essential data structures and algorithms that power modern software systems.",
            instructor_id=instructor.id,
            level=CourseLevel.INTERMEDIATE,
            duration="10 weeks",
            published=True,
        )
        db.add(course2)
        await db.flush()

        unit2 = Unit(id="unit2", course_id=course2.id, title="Core Data Structures", order_index=0)
        db.add(unit2)
        await db.flush()

        ch7  = Chapter(id="ch7",  unit_id=unit2.id, title="Arrays and Linked Lists", type=ChapterType.VIDEO,   duration="55 min", order_index=0)
        ch8  = Chapter(id="ch8",  unit_id=unit2.id, title="Stacks and Queues",       type=ChapterType.VIDEO,   duration="45 min", order_index=1)
        ch9  = Chapter(id="ch9",  unit_id=unit2.id, title="Trees and Graphs",        type=ChapterType.READING, duration="70 min", order_index=2)
        ch10 = Chapter(id="ch10", unit_id=unit2.id, title="Sorting Algorithms",      type=ChapterType.VIDEO,   duration="60 min", order_index=3)
        ch11 = Chapter(id="ch11", unit_id=unit2.id, title="Dynamic Programming",     type=ChapterType.READING, duration="80 min", order_index=4)
        db.add_all([ch7, ch8, ch9, ch10, ch11])
        await db.flush()

        await db.execute(chapter_competency.insert(), [
            {"chapter_id": "ch7",  "competency_id": "c5"},
            {"chapter_id": "ch8",  "competency_id": "c5"},
            {"chapter_id": "ch9",  "competency_id": "c5"},
            {"chapter_id": "ch9",  "competency_id": "c12"},
            {"chapter_id": "ch10", "competency_id": "c11"},
            {"chapter_id": "ch11", "competency_id": "c13"},
        ])

        # ------ Course 3: OOP Design Patterns ------
        course3 = Course(
            id="course3",
            title="Object-Oriented Design Patterns",
            description="Learn battle-tested design patterns used by professional software engineers worldwide.",
            instructor_id=instructor.id,
            level=CourseLevel.ADVANCED,
            duration="6 weeks",
            published=True,
        )
        db.add(course3)
        await db.flush()

        unit3 = Unit(id="unit3", course_id=course3.id, title="Design Patterns", order_index=0)
        db.add(unit3)
        await db.flush()

        ch12 = Chapter(id="ch12", unit_id=unit3.id, title="OOP Principles Review", type=ChapterType.VIDEO,   duration="40 min", order_index=0)
        ch13 = Chapter(id="ch13", unit_id=unit3.id, title="Creational Patterns",   type=ChapterType.READING, duration="55 min", order_index=1)
        ch14 = Chapter(id="ch14", unit_id=unit3.id, title="Structural Patterns",   type=ChapterType.VIDEO,   duration="60 min", order_index=2)
        ch15 = Chapter(id="ch15", unit_id=unit3.id, title="Behavioral Patterns",   type=ChapterType.READING, duration="65 min", order_index=3)
        db.add_all([ch12, ch13, ch14, ch15])
        await db.flush()

        await db.execute(chapter_competency.insert(), [
            {"chapter_id": "ch12", "competency_id": "c7"},
            {"chapter_id": "ch13", "competency_id": "c7"},
            {"chapter_id": "ch13", "competency_id": "c8"},
            {"chapter_id": "ch14", "competency_id": "c8"},
            {"chapter_id": "ch15", "competency_id": "c7"},
            {"chapter_id": "ch15", "competency_id": "c8"},
        ])

        # ------ Enrollments ------
        db.add(Enrollment(user_id=student.id, course_id=course1.id, progress=62.0,
                          enrolled_at=datetime.utcnow(), last_accessed=datetime.utcnow()))
        db.add(Enrollment(user_id=student.id, course_id=course2.id, progress=28.0,
                          enrolled_at=datetime.utcnow(), last_accessed=datetime.utcnow()))
        await db.flush()
        print("Created courses, chapters, quiz, and enrollments")

        await db.commit()

    print("\n✅ Database seeded successfully!")
    print("\nDemo credentials:")
    print("  Student:    student@demo.com    / demo")
    print("  Instructor: instructor@demo.com / demo")


if __name__ == "__main__":
    asyncio.run(seed_database())

