from pydantic import BaseModel, EmailStr, Field, validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class UserRole(str, Enum):
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

class RiskLevel(str, Enum):
    GOOD = "good"
    MODERATE = "moderate"
    HIGH = "high"

class ChapterType(str, Enum):
    VIDEO = "video"
    READING = "reading"
    QUIZ = "quiz"

class CourseLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# ============ Auth Models ============

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)
    name: str = Field(..., min_length=2)
    role: UserRole = UserRole.STUDENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str
    email: str
    role: str

# ============ User Models ============

class UserBase(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    role: UserRole
    avatar: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime

class UserInDB(UserBase):
    password_hash: str

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

class UserSettings(BaseModel):
    notifications: Dict[str, bool] = {}
    theme: str = "theme-minimal"
    email_digest: bool = True

# ============ Competency Models ============

class Competency(BaseModel):
    id: str
    name: str
    category: str
    mastery: float = 0.0  # 0-100

class CompetencyUpdate(BaseModel):
    competency_id: str
    mastery_change: float  # Can be positive or negative

# ============ Course Models ============

class ChapterCreate(BaseModel):
    title: str
    type: ChapterType
    video_url: Optional[str] = None
    duration: Optional[str] = None
    content: Optional[str] = None
    unit_id: str

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[ChapterType] = None
    video_url: Optional[str] = None
    duration: Optional[str] = None
    content: Optional[str] = None

class Chapter(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    unit_id: str
    title: str
    type: ChapterType
    video_url: Optional[str] = None
    duration: Optional[str] = None
    content: Optional[str] = None
    order_index: int
    quiz_id: Optional[str] = None
    completed: Optional[bool] = False

# ============ Unit Models ============

class UnitCreate(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: str

class UnitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class Unit(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    course_id: str
    title: str
    description: Optional[str] = None
    order_index: int
    chapters: List[Chapter] = []

class CourseCreate(BaseModel):
    title: str
    description: str
    level: CourseLevel
    duration: Optional[str] = None
    enrollment_cap: Optional[int] = None
    adaptive_enabled: bool = True
    auto_remediation: bool = True
    grade_gate: bool = False
    materials_link: Optional[str] = None
    google_classroom_link: Optional[str] = None
    google_meet_link: Optional[str] = None
    chaptersData: Optional[List[Dict[str, Any]]] = None

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[CourseLevel] = None
    duration: Optional[str] = None
    enrollment_cap: Optional[int] = None
    adaptive_enabled: Optional[bool] = None
    auto_remediation: Optional[bool] = None
    grade_gate: Optional[bool] = None
    published: Optional[bool] = None
    materials_link: Optional[str] = None
    google_classroom_link: Optional[str] = None
    google_meet_link: Optional[str] = None
    chaptersData: Optional[List[Dict[str, Any]]] = None

class Course(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    description: str
    instructor_id: str
    thumbnail: Optional[str] = None
    level: CourseLevel
    duration: Optional[str] = None
    published: bool = False
    created_at: datetime
    updated_at: datetime
    enrollment_cap: Optional[int] = None
    adaptive_enabled: bool = True
    auto_remediation: bool = True
    grade_gate: bool = False
    materials_link: Optional[str] = None
    google_classroom_link: Optional[str] = None
    google_meet_link: Optional[str] = None
    progress: Optional[float] = None
    is_enrolled: bool = False
    average_rating: Optional[float] = None
    rating_count: int = 0
    enrollment_count: int = 0
    user_rating: Optional[int] = None  # current user's rating if any
    units: List[Unit] = []

class Enrollment(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: str
    course_id: str
    progress: float = 0.0  # 0-100
    enrolled_at: datetime
    last_accessed: Optional[datetime] = None
    completed_chapters: List[str] = []

# ============ Quiz Models ============

class QuizQuestion(BaseModel):
    id: str
    text: str
    options: List[str]
    correct_index: int
    explanation: str
    competency: str

class QuizCreate(BaseModel):
    title: str
    questions: List[QuizQuestion]
    time_limit: int = 90  # seconds
    course_id: Optional[str] = None
    chapter_id: Optional[str] = None

class QuizSubmission(BaseModel):
    quiz_id: str
    answers: Dict[int, int]  # question_index -> selected_option_index
    time_taken: int  # seconds

class QuizResult(BaseModel):
    result_id: str
    user_id: str
    quiz_id: str
    score: float  # 0-100
    answers: Dict[int, int]
    correct_count: int
    total_questions: int
    time_taken: int
    completed_at: datetime
    competency_updates: List[CompetencyUpdate] = []

# ============ Recommendation Models ============

class Recommendation(BaseModel):
    id: str
    user_id: str
    chapter_id: str
    chapter_title: str
    course_id: str
    course_title: str
    reason: str
    estimated_time: int  # minutes
    related_competency: str
    current_mastery: float
    expected_mastery: float
    priority: Priority
    created_at: datetime

# ============ Student Models (for Instructor view) ============

class StudentInfo(BaseModel):
    id: str
    name: str
    email: EmailStr
    avatar: Optional[str] = None
    risk_level: RiskLevel
    progress: float  # 0-100
    weakest_competency: str
    weekly_time: int  # hours
    last_active: str
    competencies: Dict[str, float]  # competency_id -> mastery

# ============ Analytics Models ============

class ProgressDataPoint(BaseModel):
    week: str
    progress: float
    quiz_score: float

class EnrollmentDataPoint(BaseModel):
    month: str
    students: int

class AnalyticsResponse(BaseModel):
    total_students: int
    average_progress: float
    at_risk_count: int
    weekly_progress: List[ProgressDataPoint]
    enrollment_trend: List[EnrollmentDataPoint]

# ============ Notification Models ============

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, success, warning, error
    link: Optional[str] = None

class Notification(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    link: Optional[str] = None
    read: bool = False
    created_at: datetime

# ============ Message Models ============

class MessageCreate(BaseModel):
    recipient_id: str
    subject: str
    message: str

class Message(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    recipient_id: str
    subject: str
    message: str
    read: bool = False
    created_at: datetime

# ============ Search Models ============

class SearchResult(BaseModel):
    type: str  # course, student, chapter
    id: str
    title: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
