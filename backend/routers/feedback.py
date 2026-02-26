"""
Feedback generation router.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import InterviewSession, InterviewTopic, EmotionSnapshot
from services.gemini_text import generate_feedback

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("/{session_id}")
async def create_feedback(session_id: int, db: Session = Depends(get_db)):
    """Generate AI feedback for a completed interview session."""
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.transcript:
        raise HTTPException(status_code=400, detail="No transcript available")

    # Build context string
    context_parts = []
    if session.session_type == "topic" and session.topic_id:
        topic = db.query(InterviewTopic).filter(InterviewTopic.id == session.topic_id).first()
        if topic:
            context_parts.append(f"Topic: {topic.name} ({topic.category})")
            context_parts.append(f"Subtopics: {', '.join(topic.subtopics)}")
    elif session.session_type == "custom":
        context_parts.append(f"Custom interview for: {session.job_title}")
        if session.job_description:
            context_parts.append(f"Job description: {session.job_description[:500]}")

    context_parts.append(f"Difficulty: {session.difficulty}")
    context_parts.append(f"Duration: {session.duration_seconds}s")
    interview_context = "\n".join(context_parts)

    # Get emotion data
    snapshots = db.query(EmotionSnapshot).filter(
        EmotionSnapshot.session_id == session_id
    ).order_by(EmotionSnapshot.timestamp).all()

    emotion_data = [
        {
            "timestamp": s.timestamp,
            "emotions": s.emotions,
            "dominant_emotion": s.dominant_emotion,
            "stress_score": s.stress_score,
            "confidence_score": s.confidence_score,
        }
        for s in snapshots
    ]

    # Generate feedback
    feedback = await generate_feedback(session.transcript, emotion_data, interview_context)

    # Save feedback to session
    session.feedback = feedback
    session.overall_score = feedback.get("overall_score", 0)
    db.commit()

    return feedback


@router.get("/{session_id}")
def get_feedback(session_id: int, db: Session = Depends(get_db)):
    """Get stored feedback for a session."""
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.feedback:
        raise HTTPException(status_code=404, detail="No feedback generated yet")
    return session.feedback
