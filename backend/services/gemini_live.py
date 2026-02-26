"""
Gemini Live API handler using google-genai SDK.
Manages real-time bidirectional audio streaming sessions.
Uses Vertex AI with Application Default Credentials (ADC).
Configured for gemini-live-2.5-flash-native-audio model.
"""
import asyncio
import logging
from google import genai
from google.genai import types
from config import GEMINI_MODEL, GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION

logger = logging.getLogger(__name__)


class GeminiLiveSession:
    """Manages a single Gemini Live API session for an interview."""

    def __init__(self, system_prompt: str):
        self.system_prompt = system_prompt
        self.client = genai.Client(
            vertexai=True,
            project=GOOGLE_CLOUD_PROJECT,
            location=GOOGLE_CLOUD_LOCATION,
        )
        self.session = None
        self.is_active = False
        self._context_manager = None

    async def connect(self):
        """Establish connection to Gemini Live API."""
        try:
            config = types.LiveConnectConfig(
                response_modalities=["AUDIO"],
                output_audio_transcription=types.AudioTranscriptionConfig(),
                input_audio_transcription=types.AudioTranscriptionConfig(),
                system_instruction=types.Content(
                    parts=[types.Part(text=self.system_prompt)]
                ),
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Aoede"
                        )
                    )
                ),
                realtime_input_config=types.RealtimeInputConfig(
                    activity_handling="START_OF_ACTIVITY_INTERRUPTS",
                    automatic_activity_detection=types.AutomaticActivityDetection(
                        # HIGH = detect speech start quickly so no words are missed
                        start_of_speech_sensitivity="START_SENSITIVITY_HIGH",
                        # HIGH = detect end of speech quickly for snappy response
                        end_of_speech_sensitivity="END_SENSITIVITY_HIGH",
                        # 500ms silence = user finished their sentence
                        silence_duration_ms=500,
                    ),
                ),
            )

            # live.connect() returns an async context manager
            self._context_manager = self.client.aio.live.connect(
                model=GEMINI_MODEL,
                config=config,
            )
            self.session = await self._context_manager.__aenter__()
            self.is_active = True
            logger.info("Gemini Live session connected")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Gemini Live API: {e}")
            self.is_active = False
            raise

    async def send_audio(self, audio_data: bytes):
        """Send raw PCM audio data to Gemini."""
        if not self.session or not self.is_active:
            return
        try:
            await self.session.send(
                input=types.LiveClientRealtimeInput(
                    media_chunks=[
                        types.Blob(
                            data=audio_data,
                            mime_type="audio/pcm;rate=16000",
                        )
                    ]
                )
            )
        except Exception as e:
            logger.error(f"Error sending audio: {e}")
            # If the connection is dead, mark inactive to stop further sends
            self.is_active = False

    async def send_text(self, text: str):
        """Send text input to Gemini (for context injection)."""
        if not self.session or not self.is_active:
            return
        try:
            await self.session.send(
                input=types.LiveClientContent(
                    turns=[
                        types.Content(
                            role="user",
                            parts=[types.Part(text=text)]
                        )
                    ],
                    turn_complete=True,
                )
            )
        except Exception as e:
            logger.error(f"Error sending text: {e}")

    async def receive_responses(self, on_audio=None, on_text=None, on_turn_complete=None, on_input_transcription=None):
        """
        Listen for responses from Gemini. Calls callbacks for audio/text/turn_complete events.
        For native audio models, text comes via output_transcription, not model_turn.parts.text.
        Re-enters the receive loop after each turn since session.receive() yields
        responses for a single turn and then the iterator ends.
        """
        if not self.session or not self.is_active:
            return

        try:
            while self.is_active:
                turn_received = False
                async for response in self.session.receive():
                    if not self.is_active:
                        return

                    server_content = response.server_content
                    if server_content:
                        # Audio data from model turn
                        if server_content.model_turn:
                            for part in server_content.model_turn.parts:
                                if part.inline_data and part.inline_data.data:
                                    if on_audio:
                                        await on_audio(part.inline_data.data)

                        # AI speech transcription
                        if server_content.output_transcription and server_content.output_transcription.text:
                            if on_text:
                                await on_text(server_content.output_transcription.text)

                        # User speech transcription
                        if server_content.input_transcription and server_content.input_transcription.text:
                            if on_input_transcription:
                                await on_input_transcription(server_content.input_transcription.text)

                        if server_content.turn_complete:
                            logger.info("Gemini turn complete, re-entering receive loop...")
                            if on_turn_complete:
                                await on_turn_complete()
                            turn_received = True

                        if server_content.interrupted:
                            logger.info("Gemini turn was interrupted by user")
                            turn_received = True

                if not turn_received:
                    # Iterator ended without a turn_complete — session may be dead
                    logger.warning("Gemini receive iterator ended unexpectedly")
                    break

        except asyncio.CancelledError:
            logger.info("Receive task cancelled")
        except Exception as e:
            logger.error(f"Error receiving from Gemini: {e}")

    async def disconnect(self):
        """Close the Gemini Live session."""
        self.is_active = False
        if self._context_manager:
            try:
                await self._context_manager.__aexit__(None, None, None)
            except Exception:
                pass
            self._context_manager = None
        self.session = None
        logger.info("Gemini Live session disconnected")
