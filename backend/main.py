"""
Mock Interview & Skill Feedback Platform — FastAPI Entry Point
"""
import logging
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, SessionLocal
from routers import topics, resume, interviews, feedback, code
from routers.topics import seed_topics
from websocket_handler import InterviewWebSocketHandler

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="MockMind",
    description="AI-powered mock interview and skill feedback platform",
    version="1.0.0",
)

# ── CORS ────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────
app.include_router(topics.router)
app.include_router(resume.router)
app.include_router(interviews.router)
app.include_router(feedback.router)
app.include_router(code.router)


# ── Startup ─────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    init_db()
    db = SessionLocal()
    try:
        seed_topics(db)
    finally:
        db.close()


# ── Health Check ────────────────────────────────────
@app.get("/api/health")
def health_check():
    from config import GOOGLE_CLOUD_PROJECT
    return {
        "status": "ok",
        "gcp_project_configured": bool(GOOGLE_CLOUD_PROJECT),
    }


# ── WebSocket Endpoint ──────────────────────────────
@app.websocket("/ws/interview/{session_id}")
async def interview_websocket(websocket: WebSocket, session_id: int):
    handler = InterviewWebSocketHandler(websocket, session_id)
    await handler.run()
