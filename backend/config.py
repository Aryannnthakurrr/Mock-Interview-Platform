import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL = "gemini-2.5-flash-preview-native-audio-dialog"
GEMINI_TEXT_MODEL = "gemini-2.5-flash"

DATABASE_URL = "sqlite:///./interview_platform.db"
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Audio settings for Gemini Live API
AUDIO_SAMPLE_RATE_INPUT = 16000   # 16kHz PCM input
AUDIO_SAMPLE_RATE_OUTPUT = 24000  # 24kHz PCM output
AUDIO_CHANNELS = 1
AUDIO_SAMPLE_WIDTH = 2  # 16-bit
