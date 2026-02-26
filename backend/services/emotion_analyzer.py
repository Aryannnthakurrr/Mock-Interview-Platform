"""
Facial emotion analysis using DeepFace.
Processes base64-encoded webcam frames and returns emotion breakdown + stress score.
"""
import base64
import io
import numpy as np
from PIL import Image
import logging

logger = logging.getLogger(__name__)

# Lazy-load DeepFace to avoid slow startup
_deepface = None

def _get_deepface():
    global _deepface
    if _deepface is None:
        try:
            from deepface import DeepFace
            _deepface = DeepFace
            logger.info("DeepFace loaded successfully")
        except ImportError:
            logger.warning("DeepFace not available - emotion analysis disabled")
            _deepface = False
    return _deepface


def analyze_frame(base64_image: str) -> dict | None:
    """
    Analyze a base64-encoded image for facial emotions.
    Returns emotion breakdown, dominant emotion, stress/confidence scores.
    """
    deepface = _get_deepface()
    if not deepface:
        return _generate_fallback()

    try:
        # Decode base64 → numpy array
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]

        image_bytes = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(image)

        # Analyze with DeepFace
        results = deepface.analyze(
            img_path=img_array,
            actions=["emotion"],
            enforce_detection=False,
            silent=True,
        )

        if not results:
            return _generate_fallback()

        result = results[0] if isinstance(results, list) else results
        emotions = result.get("emotion", {})
        dominant = result.get("dominant_emotion", "neutral")

        # Normalize to 0-1 range (DeepFace returns percentages)
        # Convert np.float32 → Python float to avoid JSON serialization errors
        emotions_normalized = {k: round(float(v) / 100, 4) for k, v in emotions.items()}

        # Compute stress & confidence scores
        stress_score = _compute_stress(emotions_normalized)
        confidence_score = _compute_confidence(emotions_normalized)

        return {
            "emotions": emotions_normalized,
            "dominant_emotion": str(dominant),
            "stress_score": round(float(stress_score), 4),
            "confidence_score": round(float(confidence_score), 4),
        }

    except Exception as e:
        logger.error(f"Emotion analysis error: {e}")
        return _generate_fallback()


def _compute_stress(emotions: dict) -> float:
    """Compute stress score from emotion probabilities."""
    stress_emotions = {
        "fear": 1.0,
        "angry": 0.8,
        "sad": 0.6,
        "disgust": 0.5,
        "surprise": 0.3,
    }
    score = sum(emotions.get(e, 0) * w for e, w in stress_emotions.items())
    return min(1.0, max(0.0, score))


def _compute_confidence(emotions: dict) -> float:
    """Compute confidence score from emotion probabilities."""
    confidence_emotions = {
        "happy": 0.8,
        "neutral": 1.0,
        "surprise": 0.3,
    }
    stress_penalty = {
        "fear": -0.8,
        "sad": -0.5,
        "angry": -0.3,
    }
    score = sum(emotions.get(e, 0) * w for e, w in confidence_emotions.items())
    score += sum(emotions.get(e, 0) * w for e, w in stress_penalty.items())
    return min(1.0, max(0.0, score))


def _generate_fallback() -> dict:
    """Return neutral fallback when analysis fails."""
    return {
        "emotions": {
            "happy": 0.0, "sad": 0.0, "angry": 0.0,
            "surprise": 0.0, "fear": 0.0, "disgust": 0.0,
            "neutral": 1.0,
        },
        "dominant_emotion": "neutral",
        "stress_score": 0.0,
        "confidence_score": 0.5,
    }
