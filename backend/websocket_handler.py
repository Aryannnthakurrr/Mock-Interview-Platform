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
        self._current_user_text = ""
        self._silence_timer: asyncio.Task | None = None
        self._user_spoke = False

    async def run(self):
        """Main handler loop."""
        await self.websocket.accept()
        db = SessionLocal()
        self._audio_chunk_count = 0

        try:
            # Load interview session from DB
            session = db.query(InterviewSession).filter(
                InterviewSession.id == self.session_id
            ).first()

            if not session:
                await self._send_json({"type": "error", "message": "Session not found"})
                return

            # If session was already completed (e.g. from a previous aborted connection),
            # reset it so it can be re-used
            if session.status == "completed":
                session.status = "created"
                session.transcript = []
                session.duration_seconds = 0
                db.commit()

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
                    on_input_transcription=self._handle_user_transcription,
                )
            )

            # Trigger the AI to speak first — introduce itself and ask the first question
            await self.gemini_session.send_text(
                "Begin the interview now. Introduce yourself and ask your first question."
            )

            # Listen for messages from client
            try:
                while self.is_active:
                    message = await self.websocket.receive()

                    if message.get("type") == "websocket.disconnect":
                        break

                    # Check if Gemini connection died
                    if not self.gemini_session.is_active:
                        await self._send_json({"type": "error", "message": "AI connection lost. Please start a new interview."})
                        break

                    if "bytes" in message:
                        # Raw PCM audio from client mic
                        self._audio_chunk_count += 1
                        if self._audio_chunk_count <= 3 or self._audio_chunk_count % 100 == 0:
                            logger.info(f"Session {self.session_id}: audio chunk #{self._audio_chunk_count}, size={len(message['bytes'])} bytes")
                        # User is sending audio — they are speaking, cancel re-prompt timer
                        if not self._user_spoke:
                            self._user_spoke = True
                            if self._silence_timer and not self._silence_timer.done():
                                self._silence_timer.cancel()
                                logger.info(f"Session {self.session_id}: silence timer cancelled — user audio detected")
                        await self.gemini_session.send_audio(message["bytes"])

                    elif "text" in message:
                        data = json.loads(message["text"])
                        await self._handle_client_message(data, db)

            except WebSocketDisconnect:
                logger.info(f"Client disconnected from session {self.session_id}")

            # Cleanup
            self.is_active = False
            if self._silence_timer and not self._silence_timer.done():
                self._silence_timer.cancel()
            receive_task.cancel()
            try:
                await receive_task
            except asyncio.CancelledError:
                pass

            # Save final state
            try:
                elapsed = int(time.time() - self.start_time)
                session.status = "completed"
                session.duration_seconds = elapsed
                session.transcript = self.transcript
                db.commit()
            except Exception:
                db.rollback()
                logger.error("Failed to save final session state")

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
        # Save any accumulated user text first
        if self._current_user_text:
            self.transcript.append({
                "role": "candidate",
                "content": self._current_user_text,
                "timestamp": time.time() - self.start_time,
            })
            try:
                await self._send_json({"type": "turn_complete", "role": "candidate"})
            except Exception:
                pass
            self._current_user_text = ""

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

    async def _silence_reprompt(self):
        """Wait for user response; if silence persists, nudge Gemini to re-prompt."""
        try:
            await asyncio.sleep(10)
            if not self._user_spoke and self.is_active and self.gemini_session and self.gemini_session.is_active:
                logger.info(f"Session {self.session_id}: No response after 10s, asking Gemini to re-prompt")
                await self.gemini_session.send_text(
                    "[The candidate has been silent for a few seconds. "
                    "Gently repeat or rephrase your last question to prompt them.]"
                )
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Silence re-prompt error: {e}")

    async def _handle_user_transcription(self, text: str):
        """Handle user speech transcription from Gemini input_transcription."""
        self._current_user_text += text
        # User spoke — cancel silence re-prompt timer
        self._user_spoke = True
        if self._silence_timer and not self._silence_timer.done():
            self._silence_timer.cancel()
        try:
            await self._send_json({
                "type": "transcript",
                "role": "candidate",
                "content": text,
                "partial": True,
            })
        except Exception as e:
            logger.error(f"Error sending user transcription: {e}")

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

        elif msg_type == "code_share":
            # Candidate shared their code for AI review / pair programming
            code_content = data.get("code", "")
            code_lang = data.get("language", "python")
            if code_content.strip() and self.gemini_session and self.gemini_session.is_active:
                logger.info(f"Session {self.session_id}: Candidate shared code ({code_lang}, {len(code_content)} chars)")
                await self.gemini_session.send_text(
                    f"[The candidate has shared their code for you to review. "
                    f"Language: {code_lang}]\n\n```{code_lang}\n{code_content}\n```\n\n"
                    f"[Review their code. Point out any issues, suggest improvements, "
                    f"or ask them to explain their approach. Be constructive and guide "
                    f"them like a pair-programming partner. Keep your response concise and spoken.]"
                )
                # Also save to transcript
                self.transcript.append({
                    "role": "candidate",
                    "content": f"[Shared code ({code_lang})]\n```{code_lang}\n{code_content}\n```",
                    "timestamp": time.time() - self.start_time,
                })

        elif msg_type == "code_run_result":
            # Candidate ran their code and is sharing the results
            stdout = data.get("stdout", "")
            stderr = data.get("stderr", "")
            status = data.get("status", "")
            code_content = data.get("code", "")
            code_lang = data.get("language", "python")
            if self.gemini_session and self.gemini_session.is_active:
                result_text = f"[The candidate just ran their code.]\n"
                if code_content:
                    result_text += f"```{code_lang}\n{code_content}\n```\n"
                result_text += f"Status: {status}\n"
                if stdout:
                    result_text += f"Output:\n```\n{stdout}\n```\n"
                if stderr:
                    result_text += f"Errors:\n```\n{stderr}\n```\n"
                result_text += (
                    "[Briefly comment on the output. If there are errors, help them debug. "
                    "If it's correct, acknowledge it and move on or suggest optimizations. "
                    "Keep it concise and conversational.]"
                )
                await self.gemini_session.send_text(result_text)
                logger.info(f"Session {self.session_id}: Candidate shared code execution result")

        elif msg_type == "playback_complete":
            # Client finished playing all queued AI audio — now start silence timer
            logger.info(f"Session {self.session_id}: AI audio playback finished, starting silence timer")
            self._user_spoke = False
            if self._silence_timer and not self._silence_timer.done():
                self._silence_timer.cancel()
            self._silence_timer = asyncio.create_task(self._silence_reprompt())

        elif msg_type == "end":
            # Client ending interview
            self.is_active = False

    async def _analyze_emotion_frame(self, base64_image: str, db: Session):
        """Analyze a webcam frame for emotions and store result."""
        # Use a separate DB session to avoid poisoning the main session on error
        emotion_db = SessionLocal()
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
                emotion_db.add(snapshot)
                emotion_db.commit()

                # Send to client
                await self._send_json({
                    "type": "emotion",
                    "timestamp": timestamp,
                    "data": result,
                })
        except Exception as e:
            emotion_db.rollback()
            logger.error(f"Emotion analysis error: {e}")
        finally:
            emotion_db.close()

    async def _send_json(self, data: dict):
        """Send JSON message to client."""
        try:
            await self.websocket.send_json(data)
        except Exception:
            pass
