"""
Gemini Live API handler using google-genai SDK.
Manages real-time bidirectional audio streaming sessions.
"""
import asyncio
import base64
import logging
from google import genai
from google.genai import types
from config import GOOGLE_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)


class GeminiLiveSession:
    """Manages a single Gemini Live API session for an interview."""

    def __init__(self, system_prompt: str):
        self.system_prompt = system_prompt
        self.client = genai.Client(api_key=GOOGLE_API_KEY)
        self.session = None
        self.is_active = False
        self._receive_task = None

    async def connect(self):
        """Establish connection to Gemini Live API."""
        try:
            config = types.LiveConnectConfig(
                response_modalities=["AUDIO", "TEXT"],
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
            )

            self.session = await self.client.aio.live.connect(
                model=GEMINI_MODEL,
                config=config,
            )
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

    async def receive_responses(self, on_audio=None, on_text=None, on_turn_complete=None):
        """
        Listen for responses from Gemini. Calls callbacks for audio/text/turn_complete events.
        This runs as a long-lived coroutine.
        """
        if not self.session or not self.is_active:
            return

        try:
            async for response in self.session.receive():
                if not self.is_active:
                    break

                server_content = response.server_content
                if server_content:
                    if server_content.model_turn:
                        for part in server_content.model_turn.parts:
                            if part.inline_data and part.inline_data.data:
                                if on_audio:
                                    await on_audio(part.inline_data.data)
                            if part.text:
                                if on_text:
                                    await on_text(part.text)

                    if server_content.turn_complete:
                        if on_turn_complete:
                            await on_turn_complete()

        except asyncio.CancelledError:
            logger.info("Receive task cancelled")
        except Exception as e:
            logger.error(f"Error receiving from Gemini: {e}")

    async def disconnect(self):
        """Close the Gemini Live session."""
        self.is_active = False
        if self._receive_task:
            self._receive_task.cancel()
            try:
                await self._receive_task
            except asyncio.CancelledError:
                pass
        if self.session:
            try:
                await self.session.close()
            except Exception:
                pass
            self.session = None
        logger.info("Gemini Live session disconnected")
