from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, Text, Table, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
import enum
from .base import Base

def generate_uuid():
    return str(uuid4())

class UserRole(str, enum.Enum):
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

class ChapterType(str, enum.Enum):
    VIDEO = "video"
    READING = "reading"
    QUIZ = "quiz"

class CourseLevel(str, enum.Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

chapter_competency = Table('chapter_competency', Base.metadata,
    Column('chapter_id', String, ForeignKey('chapters.id')),
    Column('competency_id', String, ForeignKey('competencies.id'))
)

question_competency = Table('question_competency', Base.metadata,
    Column('question_id', String, ForeignKey('quiz_questions.id')),
    Column('competency_id', String, ForeignKey('competencies.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    avatar = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    courses_taught = relationship("Course", back_populates="instructor")
    enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")

class Competency(Base):
    __tablename__ = "competencies"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, unique=True)
    category = Column(String, nullable=False)

class Course(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    instructor_id = Column(String, ForeignKey("users.id"), nullable=False)
    thumbnail = Column(String, nullable=True)
    level = Column(Enum(CourseLevel), default=CourseLevel.BEGINNER)
    duration = Column(String, nullable=True)
    published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    enrollment_cap = Column(Integer, nullable=True)
    adaptive_enabled = Column(Boolean, default=True)
    auto_remediation = Column(Boolean, default=True)
    grade_gate = Column(Boolean, default=False)
    
    instructor = relationship("User", back_populates="courses_taught")
    units = relationship("Unit", back_populates="course", cascade="all, delete-orphan", order_by="Unit.order_index")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")

class Unit(Base):
    __tablename__ = "units"
    id = Column(String, primary_key=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    order_index = Column(Integer, default=0)

    course = relationship("Course", back_populates="units")
    chapters = relationship("Chapter", back_populates="unit", cascade="all, delete-orphan", order_by="Chapter.order_index")

class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(String, primary_key=True, default=generate_uuid)
    unit_id = Column(String, ForeignKey("units.id"), nullable=False)
    title = Column(String, nullable=False)
    type = Column(Enum(ChapterType), nullable=False)
    duration = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    quiz_id = Column(String, ForeignKey("quizzes.id"), nullable=True)

    unit = relationship("Unit", back_populates="chapters")
    quiz = relationship("Quiz")
    competencies = relationship("Competency", secondary=chapter_competency)

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    time_limit = Column(Integer, default=90)
    pass_threshold = Column(Float, default=70.0)
    
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(String, primary_key=True, default=generate_uuid)
    quiz_id = Column(String, ForeignKey("quizzes.id"), nullable=False)
    text = Column(String, nullable=False)
    options = Column(Text, nullable=False) 
    correct_index = Column(Integer, nullable=False)
    explanation = Column(String, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")
    competencies = relationship("Competency", secondary=question_competency)

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    progress = Column(Float, default=0.0)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    last_accessed = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

class UserCompetencyProgress(Base):
    __tablename__ = "user_competency_progress"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    competency_id = Column(String, ForeignKey("competencies.id"), nullable=False)
    mastery_level = Column(Float, default=0.0)

class QuizResult(Base):
    __tablename__ = "quiz_results"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(String, ForeignKey("quizzes.id"), nullable=False)
    score = Column(Float, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)
