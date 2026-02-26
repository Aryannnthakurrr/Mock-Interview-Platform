import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# Vertex AI / ADC configuration
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "")
GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

# Tell google-genai SDK to use Vertex AI backend (picks up ADC automatically)
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "true")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", GOOGLE_CLOUD_PROJECT)
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", GOOGLE_CLOUD_LOCATION)

GEMINI_MODEL = "gemini-live-2.5-flash-native-audio"
GEMINI_TEXT_MODEL = "gemini-2.5-flash"

DATABASE_URL = "sqlite:///./interview_platform.db"
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Audio settings for Gemini Live API
AUDIO_SAMPLE_RATE_INPUT = 16000   # 16kHz PCM input
AUDIO_SAMPLE_RATE_OUTPUT = 24000  # 24kHz PCM output
AUDIO_CHANNELS = 1
AUDIO_SAMPLE_WIDTH = 2  # 16-bit
