from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class InterviewTopic(Base):
    __tablename__ = "interview_topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # Software, Data Science, PM, etc.
    icon = Column(String(10), default="📝")
    description = Column(Text, default="")
    subtopics = Column(JSON, default=list)
    system_prompt_template = Column(Text, default="")
    difficulty_levels = Column(JSON, default=lambda: ["beginner", "intermediate", "advanced"])

    sessions = relationship("InterviewSession", back_populates="topic")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_type = Column(String(20), nullable=False)  # "topic" or "custom"
    topic_id = Column(Integer, ForeignKey("interview_topics.id"), nullable=True)
    difficulty = Column(String(20), default="intermediate")

    # For custom interviews
    resume_text = Column(Text, default="")
    resume_structured = Column(JSON, default=dict)
    job_description = Column(Text, default="")
    job_title = Column(String(200), default="")

    # Session state
    status = Column(String(20), default="created")  # created, active, completed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)

    # Results
    transcript = Column(JSON, default=list)  # [{role, content, timestamp}]
    overall_score = Column(Float, nullable=True)
    feedback = Column(JSON, default=dict)

    topic = relationship("InterviewTopic", back_populates="sessions")
    emotion_snapshots = relationship("EmotionSnapshot", back_populates="session", cascade="all, delete-orphan")


class EmotionSnapshot(Base):
    __tablename__ = "emotion_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    timestamp = Column(Float, nullable=False)  # seconds since session start
    source = Column(String(10), default="face")  # "face" or "voice"

    # Emotion probabilities
    emotions = Column(JSON, default=dict)  # {happy: 0.1, sad: 0.05, ...}
    dominant_emotion = Column(String(20), default="neutral")
    stress_score = Column(Float, default=0.0)  # 0-1, computed from emotions
    confidence_score = Column(Float, default=0.0)  # 0-1

    session = relationship("InterviewSession", back_populates="emotion_snapshots")
