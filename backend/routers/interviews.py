"""
Interview session management router.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from database import get_db
from models import InterviewSession, InterviewTopic, EmotionSnapshot
from schemas import InterviewCreate, InterviewOut, InterviewListItem

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


@router.post("", response_model=InterviewOut)
def create_interview(data: InterviewCreate, db: Session = Depends(get_db)):
    """Create a new interview session."""
    session = InterviewSession(
        session_type=data.session_type,
        topic_id=data.topic_id if data.session_type == "topic" else None,
        difficulty=data.difficulty,
        resume_text=data.resume_text or "",
        job_description=data.job_description or "",
        job_title=data.job_title or "",
        status="created",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=list[InterviewListItem])
def list_interviews(db: Session = Depends(get_db)):
    """List all interview sessions, most recent first."""
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).all()
    result = []
    for s in sessions:
        topic_name = None
        if s.topic_id:
            topic = db.query(InterviewTopic).filter(InterviewTopic.id == s.topic_id).first()
            topic_name = topic.name if topic else None
        result.append(InterviewListItem(
            id=s.id,
            session_type=s.session_type,
            topic_id=s.topic_id,
            topic_name=topic_name,
            difficulty=s.difficulty,
            job_title=s.job_title,
            status=s.status,
            created_at=s.created_at,
            duration_seconds=s.duration_seconds,
            overall_score=s.overall_score,
        ))
    return result


@router.get("/{session_id}")
def get_interview(session_id: int, db: Session = Depends(get_db)):
    """Get full interview session details."""
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Build response with topic_name for frontend
    topic_name = None
    if session.topic_id:
        topic = db.query(InterviewTopic).filter(InterviewTopic.id == session.topic_id).first()
        topic_name = topic.name if topic else None

    return {
        "id": session.id,
        "session_type": session.session_type,
        "topic_id": session.topic_id,
        "topic_name": topic_name,
        "difficulty": session.difficulty,
        "job_title": session.job_title,
        "status": session.status,
        "created_at": session.created_at,
        "ended_at": session.ended_at,
        "duration_seconds": session.duration_seconds,
        "overall_score": session.overall_score,
        "transcript": session.transcript,
        "feedback": session.feedback,
    }


@router.patch("/{session_id}")
def update_interview(session_id: int, updates: dict, db: Session = Depends(get_db)):
    """Update interview session (status, transcript, etc.)."""
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if "status" in updates:
        session.status = updates["status"]
        if updates["status"] == "completed":
            session.ended_at = datetime.now(timezone.utc)
    if "transcript" in updates:
        session.transcript = updates["transcript"]
    if "duration_seconds" in updates:
        session.duration_seconds = updates["duration_seconds"]
    if "overall_score" in updates:
        session.overall_score = updates["overall_score"]
    if "feedback" in updates:
        session.feedback = updates["feedback"]
    if "resume_structured" in updates:
        session.resume_structured = updates["resume_structured"]

    db.commit()
    db.refresh(session)
    return {"status": "updated", "id": session.id}


@router.get("/{session_id}/emotions")
def get_session_emotions(session_id: int, db: Session = Depends(get_db)):
    """Get all emotion snapshots for a session."""
    snapshots = db.query(EmotionSnapshot).filter(
        EmotionSnapshot.session_id == session_id
    ).order_by(EmotionSnapshot.timestamp).all()
    return [
        {
            "timestamp": s.timestamp,
            "source": s.source,
            "emotions": s.emotions,
            "dominant_emotion": s.dominant_emotion,
            "stress_score": s.stress_score,
            "confidence_score": s.confidence_score,
        }
        for s in snapshots
    ]
