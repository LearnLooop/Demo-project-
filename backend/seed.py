import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv
from utils.auth import hash_password

load_dotenv()

async def seed_database():
    """Seed database with initial data"""
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/courseweaver")
    client = AsyncIOMotorClient(mongo_url)
    db_name = mongo_url.split("/")[-1].split("?")[0] or "courseweaver"
    db = client[db_name]
    
    print("Seeding database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.courses.delete_many({})
    await db.quizzes.delete_many({})
    await db.enrollments.delete_many({})
    await db.competencies.delete_many({})
    await db.user_settings.delete_many({})
    await db.notifications.delete_many({})
    await db.quiz_results.delete_many({})
    await db.recommendations.delete_many({})
    await db.messages.delete_many({})
    
    print("Cleared existing data")
    
    # Create users
    users = [
        {
            "user_id": "u1",
            "email": "student@demo.com",
            "password_hash": hash_password("demo"),
            "name": "Alex Johnson",
            "role": "student",
            "avatar": None,
            "bio": None,
            "created_at": datetime.utcnow()
        },
        {
            "user_id": "u2",
            "email": "instructor@demo.com",
            "password_hash": hash_password("demo"),
            "name": "Dr. Sarah Chen",
            "role": "instructor",
            "avatar": None,
            "bio": "Computer Science Professor with 10 years of teaching experience",
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.users.insert_many(users)
    print(f"Created {len(users)} users")
    
    # Create default competencies for student
    competencies = {
        "user_id": "u1",
        "competencies": [
            {"id": "c1", "name": "Variables & Types", "category": "Fundamentals", "mastery": 90},
            {"id": "c2", "name": "Control Flow", "category": "Fundamentals", "mastery": 78},
            {"id": "c3", "name": "Functions", "category": "Core Concepts", "mastery": 65},
            {"id": "c4", "name": "Recursion", "category": "Core Concepts", "mastery": 42},
            {"id": "c5", "name": "Data Structures", "category": "Advanced", "mastery": 55},
            {"id": "c6", "name": "Algorithms", "category": "Advanced", "mastery": 31},
            {"id": "c7", "name": "OOP Basics", "category": "Core Concepts", "mastery": 70},
            {"id": "c8", "name": "Inheritance & Poly", "category": "Advanced", "mastery": 48},
            {"id": "c9", "name": "Error Handling", "category": "Core Concepts", "mastery": 61},
            {"id": "c10", "name": "File I/O", "category": "Fundamentals", "mastery": 82},
            {"id": "c11", "name": "Sorting Algorithms", "category": "Advanced", "mastery": 35},
            {"id": "c12", "name": "Graph Theory", "category": "Advanced", "mastery": 10},
            {"id": "c13", "name": "Dynamic Programming", "category": "Advanced", "mastery": 0},
            {"id": "c14", "name": "Concurrency", "category": "Advanced", "mastery": 20},
            {"id": "c15", "name": "Testing & Debugging", "category": "Professional", "mastery": 72},
            {"id": "c16", "name": "Code Review & Style", "category": "Professional", "mastery": 88},
        ]
    }
    await db.competencies.insert_one(competencies)
    print("Created competencies for student")
    
    # Create courses
    courses = [
        {
            "course_id": "course1",
            "title": "Introduction to Computer Science",
            "description": "Master the fundamental concepts of programming and computer science through hands-on projects and adaptive assessments.",
            "instructor_id": "u2",
            "instructor_name": "Dr. Sarah Chen",
            "thumbnail": None,
            "level": "Beginner",
            "duration": "8 weeks",
            "rating": 4.8,
            "enrolled": 1,
            "published": True,
            "adaptive_enabled": True,
            "auto_remediation": True,
            "grade_gate": False,
            "chapters": [
                {"id": "ch1", "title": "Getting Started with Python", "duration": "45 min", "completed": False, "type": "video", "competencies": ["c1", "c2"]},
                {"id": "ch2", "title": "Variables, Types, and Operators", "duration": "30 min", "completed": False, "type": "reading", "competencies": ["c1"]},
                {"id": "ch3", "title": "Control Flow Mastery", "duration": "50 min", "completed": False, "type": "video", "competencies": ["c2"]},
                {"id": "ch4", "title": "Functions and Scope", "duration": "40 min", "completed": False, "type": "video", "competencies": ["c3"]},
                {"id": "ch5", "title": "Recursion Deep Dive", "duration": "60 min", "completed": False, "type": "reading", "competencies": ["c4"]},
                {"id": "ch6", "title": "Quiz: Core Concepts", "duration": "20 min", "completed": False, "type": "quiz", "competencies": ["c1", "c2", "c3", "c4"], "quiz_id": "quiz1"},
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "course_id": "course2",
            "title": "Data Structures & Algorithms",
            "description": "Deep dive into essential data structures and algorithms that power modern software systems.",
            "instructor_id": "u2",
            "instructor_name": "Dr. Sarah Chen",
            "thumbnail": None,
            "level": "Intermediate",
            "duration": "10 weeks",
            "rating": 4.9,
            "enrolled": 1,
            "published": True,
            "adaptive_enabled": True,
            "auto_remediation": True,
            "grade_gate": False,
            "chapters": [
                {"id": "ch7", "title": "Arrays and Linked Lists", "duration": "55 min", "completed": False, "type": "video", "competencies": ["c5"]},
                {"id": "ch8", "title": "Stacks and Queues", "duration": "45 min", "completed": False, "type": "video", "competencies": ["c5"]},
                {"id": "ch9", "title": "Trees and Graphs", "duration": "70 min", "completed": False, "type": "reading", "competencies": ["c5", "c12"]},
                {"id": "ch10", "title": "Sorting Algorithms", "duration": "60 min", "completed": False, "type": "video", "competencies": ["c11"]},
                {"id": "ch11", "title": "Dynamic Programming", "duration": "80 min", "completed": False, "type": "reading", "competencies": ["c13"]},
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "course_id": "course3",
            "title": "Object-Oriented Design Patterns",
            "description": "Learn battle-tested design patterns used by professional software engineers worldwide.",
            "instructor_id": "u2",
            "instructor_name": "Dr. Sarah Chen",
            "thumbnail": None,
            "level": "Advanced",
            "duration": "6 weeks",
            "rating": 4.7,
            "enrolled": 0,
            "published": True,
            "adaptive_enabled": True,
            "auto_remediation": True,
            "grade_gate": False,
            "chapters": [
                {"id": "ch12", "title": "OOP Principles Review", "duration": "40 min", "completed": False, "type": "video", "competencies": ["c7"]},
                {"id": "ch13", "title": "Creational Patterns", "duration": "55 min", "completed": False, "type": "reading", "competencies": ["c7", "c8"]},
                {"id": "ch14", "title": "Structural Patterns", "duration": "60 min", "completed": False, "type": "video", "competencies": ["c8"]},
                {"id": "ch15", "title": "Behavioral Patterns", "duration": "65 min", "completed": False, "type": "reading", "competencies": ["c7", "c8"]},
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    await db.courses.insert_many(courses)
    print(f"Created {len(courses)} courses")
    
    # Create quiz
    quiz = {
        "quiz_id": "quiz1",
        "instructor_id": "u2",
        "title": "Core Concepts Quiz",
        "time_limit": 90,
        "course_id": "course1",
        "chapter_id": "ch6",
        "questions": [
            {
                "id": "q1",
                "text": "What is the time complexity of accessing an element by index in an array?",
                "options": ["O(n)", "O(log n)", "O(1)", "O(n²)"],
                "correct_index": 2,
                "explanation": "Array index access is O(1) because memory address is calculated directly from the base address + offset.",
                "competency": "c5"
            },
            {
                "id": "q2",
                "text": "Which of the following correctly describes recursion?",
                "options": [
                    "A loop that runs a fixed number of times",
                    "A function that calls itself directly or indirectly",
                    "A data structure that holds function references",
                    "A sorting algorithm"
                ],
                "correct_index": 1,
                "explanation": "Recursion is when a function calls itself, directly or indirectly, to solve smaller subproblems.",
                "competency": "c4"
            },
            {
                "id": "q3",
                "text": "What does the 'stack' data structure follow?",
                "options": ["FIFO", "LIFO", "Random Access", "Priority-based"],
                "correct_index": 1,
                "explanation": "A stack follows Last In, First Out (LIFO) — the last element pushed is the first popped.",
                "competency": "c5"
            },
            {
                "id": "q4",
                "text": "What is the base case in recursion used for?",
                "options": [
                    "To increase performance",
                    "To allocate more memory",
                    "To stop the recursive calls",
                    "To define the function signature"
                ],
                "correct_index": 2,
                "explanation": "The base case stops recursion from running infinitely by providing a stopping condition.",
                "competency": "c4"
            },
            {
                "id": "q5",
                "text": "Which sorting algorithm has an average time complexity of O(n log n)?",
                "options": ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
                "correct_index": 2,
                "explanation": "Merge Sort divides the array in halves (log n levels) and merges them (n work per level), giving O(n log n).",
                "competency": "c11"
            }
        ],
        "created_at": datetime.utcnow()
    }
    
    await db.quizzes.insert_one(quiz)
    print("Created quiz")
    
    # Create enrollments for demo student
    enrollments = [
        {
            "user_id": "u1",
            "course_id": "course1",
            "progress": 62.0,
            "enrolled_at": datetime.utcnow(),
            "last_accessed": datetime.utcnow(),
            "completed_chapters": ["ch1", "ch2", "ch3"]
        },
        {
            "user_id": "u1",
            "course_id": "course2",
            "progress": 28.0,
            "enrolled_at": datetime.utcnow(),
            "last_accessed": datetime.utcnow(),
            "completed_chapters": ["ch7", "ch8"]
        }
    ]
    
    await db.enrollments.insert_many(enrollments)
    print(f"Created {len(enrollments)} enrollments")
    
    # Create user settings
    settings = [
        {
            "user_id": "u1",
            "notifications": {
                "email_recommendations": True,
                "weekly_digest": True,
                "quiz_reminders": False,
                "certificates": True,
                "achievements": True
            },
            "theme": "theme-minimal",
            "email_digest": True
        },
        {
            "user_id": "u2",
            "notifications": {
                "email_recommendations": True,
                "weekly_digest": True,
                "quiz_reminders": False,
                "certificates": True,
                "achievements": True,
                "at_risk_alerts": True
            },
            "theme": "theme-minimal",
            "email_digest": True
        }
    ]
    
    await db.user_settings.insert_many(settings)
    print(f"Created settings for {len(settings)} users")
    
    print("\n✅ Database seeded successfully!")
    print("\nDemo credentials:")
    print("  Student: student@demo.com / demo")
    print("  Instructor: instructor@demo.com / demo")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
