import uuid
from datetime import datetime
from typing import List, Dict, Optional
from models import (
    Competency, CompetencyUpdate, QuizResult, Recommendation,
    Priority, RiskLevel
)

def generate_id(prefix: str = "") -> str:
    """Generate a unique ID"""
    return f"{prefix}{uuid.uuid4().hex[:12]}" if prefix else uuid.uuid4().hex[:12]

def calculate_mastery_change(is_correct: bool, current_mastery: float) -> float:
    """Calculate mastery change based on quiz performance"""
    if is_correct:
        # Increase mastery, but with diminishing returns at higher levels
        increase = 5 * (1 - current_mastery / 100)
        return min(increase, 15)  # Cap at +15
    else:
        # Decrease mastery more aggressively for incorrect answers
        return -8

def calculate_risk_level(progress: float, weekly_time: int, weakest_mastery: float) -> RiskLevel:
    """Calculate student risk level based on multiple factors"""
    risk_score = 0
    
    # Progress factor (0-40 points)
    if progress < 30:
        risk_score += 40
    elif progress < 50:
        risk_score += 20
    
    # Time spent factor (0-30 points)
    if weekly_time < 3:
        risk_score += 30
    elif weekly_time < 5:
        risk_score += 15
    
    # Weakest competency factor (0-30 points)
    if weakest_mastery < 30:
        risk_score += 30
    elif weakest_mastery < 50:
        risk_score += 15
    
    # Determine risk level
    if risk_score >= 50:
        return RiskLevel.HIGH
    elif risk_score >= 25:
        return RiskLevel.MODERATE
    else:
        return RiskLevel.GOOD

def generate_recommendations(
    user_competencies: List[Competency],
    available_chapters: List[Dict],
    max_recommendations: int = 3
) -> List[Dict]:
    """Generate personalized learning recommendations"""
    recommendations = []
    
    # Sort competencies by mastery (lowest first)
    sorted_competencies = sorted(user_competencies, key=lambda c: c.mastery)
    
    # Find chapters that address weak competencies
    for comp in sorted_competencies[:max_recommendations]:
        if comp.mastery < 70:  # Only recommend if below 70% mastery
            # Find a chapter that teaches this competency
            for chapter in available_chapters:
                if comp.id in chapter.get("competencies", []):
                    priority = Priority.HIGH if comp.mastery < 40 else Priority.MEDIUM if comp.mastery < 60 else Priority.LOW
                    
                    recommendations.append({
                        "chapter_id": chapter["id"],
                        "chapter_title": chapter["title"],
                        "course_id": chapter.get("course_id"),
                        "course_title": chapter.get("course_title"),
                        "reason": f"You scored {int(comp.mastery)}% on {comp.name} problems. This chapter covers the foundational concepts you need to strengthen your understanding.",
                        "estimated_time": int(chapter.get("duration", "30 min").split()[0]),
                        "related_competency": comp.name,
                        "current_mastery": comp.mastery,
                        "expected_mastery": min(comp.mastery + 25, 95),
                        "priority": priority.value
                    })
                    break
    
    return recommendations[:max_recommendations]

def format_time_ago(dt: datetime) -> str:
    """Format datetime as 'X days/hours ago'"""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds >= 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds >= 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "Just now"
