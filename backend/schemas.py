from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── Topics ──────────────────────────────────────────
class TopicOut(BaseModel):
    id: int
    name: str
    category: str
    icon: str
    description: str
    subtopics: list[str]
    difficulty_levels: list[str]

    class Config:
        from_attributes = True


# ── Interview Sessions ──────────────────────────────
class InterviewCreate(BaseModel):
    session_type: str  # "topic" or "custom"
    topic_id: Optional[int] = None
    difficulty: str = "intermediate"
    resume_text: Optional[str] = ""
    job_description: Optional[str] = ""
    job_title: Optional[str] = ""


class InterviewOut(BaseModel):
    id: int
    session_type: str
    topic_id: Optional[int]
    difficulty: str
    job_title: str
    status: str
    created_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: int
    overall_score: Optional[float]
    transcript: list
    feedback: dict

    class Config:
        from_attributes = True


class InterviewListItem(BaseModel):
    id: int
    session_type: str
    topic_id: Optional[int]
    topic_name: Optional[str] = None
    difficulty: str
    job_title: str
    status: str
    created_at: datetime
    duration_seconds: int
    overall_score: Optional[float]

    class Config:
        from_attributes = True


# ── Resume ──────────────────────────────────────────
class ResumeAnalysis(BaseModel):
    raw_text: str
    structured: dict  # {name, skills, projects, experience, education}


class CustomInterviewConfig(BaseModel):
    resume_text: str
    job_description: str
    job_title: str = ""


# ── Emotions ────────────────────────────────────────
class EmotionSnapshotOut(BaseModel):
    timestamp: float
    source: str
    emotions: dict
    dominant_emotion: str
    stress_score: float
    confidence_score: float

    class Config:
        from_attributes = True


# ── Feedback ────────────────────────────────────────
class FeedbackOut(BaseModel):
    session_id: int
    overall_score: float
    summary: str
    strengths: list[dict]
    weaknesses: list[dict]
    suggestions: list[str]
    emotion_summary: dict
    question_breakdown: list[dict]
