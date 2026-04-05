from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import logging

# Import routers
from routes import auth, users, courses, quizzes, competencies, recommendations, students, analytics, notifications, search, units, chapters
from utils.auth import verify_token, get_current_user
from database import init_db, close_db

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting CourseWeaver Backend...")
    await init_db()
    logger.info("Database initialized successfully")
    yield
    # Shutdown
    logger.info("Shutting down CourseWeaver Backend...")
    await close_db()
    logger.info("Database connections closed")

# Initialize FastAPI app
app = FastAPI(
    title="CourseWeaver API",
    description="Adaptive Learning Management System API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")

if origins_str == "*":
    # Allow all origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # Can't use credentials with allow_origins=["*"]
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Specific origins
    origins = [origin.strip() for origin in origins_str.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https://.*\.preview\.emergentcf\.cloud",
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "CourseWeaver API"
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(units.router, prefix="/api/units", tags=["Units"])
app.include_router(chapters.router, prefix="/api/chapters", tags=["Chapters"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["Quizzes"])
app.include_router(competencies.router, prefix="/api/competencies", tags=["Competencies"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8001))
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    uvicorn.run("server:app", host=host, port=port, reload=True)
