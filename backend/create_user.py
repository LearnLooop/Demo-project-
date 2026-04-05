import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from database import async_session_maker
from db.models import User, UserRole, generate_uuid
from utils.auth import hash_password

async def create_users():
    async with async_session_maker() as session:
        # Create an admin
        admin = User(
            id=generate_uuid(),
            email="admin@demo.com",
            password_hash=hash_password("demo"),
            name="System Admin",
            role=UserRole.ADMIN
        )
        
        # Create an instructor
        instructor = User(
            id=generate_uuid(),
            email="instructor@demo.com",
            password_hash=hash_password("demo"),
            name="Dr. Sarah Chen",
            role=UserRole.INSTRUCTOR
        )
        
        # Create a student
        student = User(
            id=generate_uuid(),
            email="student@demo.com",
            password_hash=hash_password("demo"),
            name="Alex Johnson",
            role=UserRole.STUDENT
        )
        
        session.add_all([admin, instructor, student])
        await session.commit()
        print("Users successfully created in SQLite!")
        print("Demo credentials:")
        print("  Admin: admin@demo.com / demo")
        print("  Instructor: instructor@demo.com / demo")
        print("  Student: student@demo.com / demo")

if __name__ == "__main__":
    asyncio.run(create_users())
