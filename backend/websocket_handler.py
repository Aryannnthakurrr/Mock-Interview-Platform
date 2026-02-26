"""
WebSocket handler for live interview sessions.
Proxies audio between client and Gemini Live API, handles emotion analysis.
"""
import asyncio
import base64
import json
import time
import logging
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from models import InterviewSession, InterviewTopic, EmotionSnapshot
from services.gemini_live import GeminiLiveSession
from services.prompt_builder import build_topic_prompt, build_custom_prompt, build_behavioral_prompt
from services.emotion_analyzer import analyze_frame
from database import SessionLocal

logger = logging.getLogger(__name__)


class InterviewWebSocketHandler:
    """Handles a single interview WebSocket connection."""

    def __init__(self, websocket: WebSocket, session_id: int):
        self.websocket = websocket
        self.session_id = session_id
        self.gemini_session: GeminiLiveSession | None = None
        self.transcript: list[dict] = []
        self.start_time: float = 0
        self.is_active = False
        self._current_ai_text = ""

    async def run(self):
        """Main handler loop."""
        await self.websocket.accept()
        db = SessionLocal()

        try:
            # Load interview session from DB
            session = db.query(InterviewSession).filter(
                InterviewSession.id == self.session_id
            ).first()

            if not session:
                await self._send_json({"type": "error", "message": "Session not found"})
                return

            # Build system prompt
            system_prompt = self._build_prompt(session, db)

            # Update session status
            session.status = "active"
            db.commit()

            await self._send_json({"type": "status", "message": "Connecting to AI interviewer..."})

            # Connect to Gemini Live
            self.gemini_session = GeminiLiveSession(system_prompt)
            await self.gemini_session.connect()

            self.start_time = time.time()
            self.is_active = True

            await self._send_json({"type": "status", "message": "Connected! Interview starting..."})
            await self._send_json({"type": "ready"})

            # Start receiving from Gemini in background
            receive_task = asyncio.create_task(
                self.gemini_session.receive_responses(
                    on_audio=self._handle_gemini_audio,
                    on_text=self._handle_gemini_text,
                    on_turn_complete=self._handle_turn_complete,
                )
            )

            # Listen for messages from client
            try:
                while self.is_active:
                    message = await self.websocket.receive()

                    if message.get("type") == "websocket.disconnect":
                        break

                    if "bytes" in message:
                        # Raw PCM audio from client mic
                        await self.gemini_session.send_audio(message["bytes"])

                    elif "text" in message:
                        data = json.loads(message["text"])
                        await self._handle_client_message(data, db)

            except WebSocketDisconnect:
                logger.info(f"Client disconnected from session {self.session_id}")

            # Cleanup
            self.is_active = False
            receive_task.cancel()
            try:
                await receive_task
            except asyncio.CancelledError:
                pass

            # Save final state
            elapsed = int(time.time() - self.start_time)
            session.status = "completed"
            session.duration_seconds = elapsed
            session.transcript = self.transcript
            db.commit()

        except Exception as e:
            logger.error(f"WebSocket handler error: {e}")
            try:
                await self._send_json({"type": "error", "message": str(e)})
            except Exception:
                pass
        finally:
            if self.gemini_session:
                await self.gemini_session.disconnect()
            db.close()

    def _build_prompt(self, session: InterviewSession, db: Session) -> str:
        """Build the appropriate system prompt based on interview type."""
        if session.session_type == "topic" and session.topic_id:
            topic = db.query(InterviewTopic).filter(
                InterviewTopic.id == session.topic_id
            ).first()
            if topic:
                if topic.name == "Behavioral Interview":
                    return build_behavioral_prompt()
                return build_topic_prompt(topic.name, topic.subtopics, session.difficulty)

        if session.session_type == "custom":
            return build_custom_prompt(
                session.resume_structured or {},
                session.job_description or "",
                session.job_title or "",
            )

        # Fallback generic prompt
        return build_topic_prompt("General Technical", ["Problem Solving", "Communication"], session.difficulty)

    async def _handle_gemini_audio(self, audio_data: bytes):
        """Forward Gemini audio to client."""
        try:
            # Send as base64 in a JSON message
            audio_b64 = base64.b64encode(audio_data).decode("utf-8")
            await self._send_json({
                "type": "audio",
                "data": audio_b64,
            })
        except Exception as e:
            logger.error(f"Error forwarding audio: {e}")

    async def _handle_gemini_text(self, text: str):
        """Handle text from Gemini (transcript)."""
        self._current_ai_text += text
        try:
            await self._send_json({
                "type": "transcript",
                "role": "interviewer",
                "content": text,
                "partial": True,
            })
        except Exception as e:
            logger.error(f"Error sending text: {e}")

    async def _handle_turn_complete(self):
        """Handle Gemini turn completion."""
        if self._current_ai_text:
            self.transcript.append({
                "role": "interviewer",
                "content": self._current_ai_text,
                "timestamp": time.time() - self.start_time,
            })
            self._current_ai_text = ""

        try:
            await self._send_json({"type": "turn_complete", "role": "interviewer"})
        except Exception as e:
            logger.error(f"Error sending turn complete: {e}")

    async def _handle_client_message(self, data: dict, db: Session):
        """Handle typed messages from the client."""
        msg_type = data.get("type", "")

        if msg_type == "transcript":
            # User transcript text (from speech recognition)
            content = data.get("content", "")
            if content:
                self.transcript.append({
                    "role": "candidate",
                    "content": content,
                    "timestamp": time.time() - self.start_time,
                })
                await self._send_json({
                    "type": "transcript",
                    "role": "candidate",
                    "content": content,
                    "partial": False,
                })

        elif msg_type == "frame":
            # Webcam frame for emotion analysis
            image_data = data.get("data", "")
            if image_data:
                # Analyze in background to not block
                asyncio.create_task(
                    self._analyze_emotion_frame(image_data, db)
                )

        elif msg_type == "end":
            # Client ending interview
            self.is_active = False

    async def _analyze_emotion_frame(self, base64_image: str, db: Session):
        """Analyze a webcam frame for emotions and store result."""
        try:
            result = analyze_frame(base64_image)
            if result:
                timestamp = time.time() - self.start_time

                # Save to DB
                snapshot = EmotionSnapshot(
                    session_id=self.session_id,
                    timestamp=timestamp,
                    source="face",
                    emotions=result["emotions"],
                    dominant_emotion=result["dominant_emotion"],
                    stress_score=result["stress_score"],
                    confidence_score=result["confidence_score"],
                )
                db.add(snapshot)
                db.commit()

                # Send to client
                await self._send_json({
                    "type": "emotion",
                    "timestamp": timestamp,
                    "data": result,
                })
        except Exception as e:
            logger.error(f"Emotion analysis error: {e}")

    async def _send_json(self, data: dict):
        """Send JSON message to client."""
        try:
            await self.websocket.send_json(data)
        except Exception:
            pass
