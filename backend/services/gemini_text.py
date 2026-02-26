"""
Gemini text generation wrapper for resume parsing, feedback generation, etc.
Uses Vertex AI with Application Default Credentials (ADC).
"""
import json
from google import genai
from config import GEMINI_TEXT_MODEL, GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION

# Vertex AI with ADC — explicit args required for google-genai v1.5
client = genai.Client(
    vertexai=True,
    project=GOOGLE_CLOUD_PROJECT,
    location=GOOGLE_CLOUD_LOCATION,
)


async def generate_text(prompt: str, system_instruction: str = "") -> str:
    config = {}
    if system_instruction:
        config["system_instruction"] = system_instruction

    response = client.models.generate_content(
        model=GEMINI_TEXT_MODEL,
        contents=prompt,
        config=config if config else None,
    )
    return response.text


async def parse_resume_with_ai(raw_text: str) -> dict:
    system = """You are a resume parser. Extract structured information from resume text.
Return ONLY valid JSON with no markdown formatting, no code blocks, just raw JSON."""

    prompt = f"""Parse this resume text and return a JSON object with these fields:
- "name": candidate's full name (string)
- "email": email if found (string)
- "skills": list of technical/professional skills (array of strings)
- "projects": list of projects, each with "name" and "description" (array of objects)
- "experience": list of experiences, each with "title", "company", and "description" (array of objects)
- "education": education summary (string)

Resume text:
---
{raw_text}
---

Return ONLY the JSON object, no extra text."""

    result = await generate_text(prompt, system)

    # Clean up potential markdown code block wrapping
    result = result.strip()
    if result.startswith("```"):
        lines = result.split("\n")
        result = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {
            "name": "Unknown",
            "skills": [],
            "projects": [],
            "experience": [],
            "education": "",
            "raw_parse": result,
        }


async def generate_feedback(transcript: list, emotion_data: list, interview_context: str) -> dict:
    system = """You are an interview coach analyzing a mock interview performance.
Return ONLY valid JSON with no markdown formatting, no code blocks, just raw JSON."""

    emotion_summary = ""
    if emotion_data:
        stress_scores = [e.get("stress_score", 0) for e in emotion_data]
        confidence_scores = [e.get("confidence_score", 0) for e in emotion_data]
        dominant_emotions = [e.get("dominant_emotion", "neutral") for e in emotion_data]

        avg_stress = sum(stress_scores) / len(stress_scores) if stress_scores else 0
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0

        from collections import Counter
        emotion_counts = Counter(dominant_emotions)
        most_common = emotion_counts.most_common(3)

        emotion_summary = f"""
Emotion Analysis:
- Average stress level: {avg_stress:.2f}/1.0
- Average confidence level: {avg_confidence:.2f}/1.0
- Most frequent emotions: {', '.join(f'{e}({c})' for e, c in most_common)}
- Stress trend: {'increasing' if len(stress_scores) > 1 and stress_scores[-1] > stress_scores[0] else 'stable/decreasing'}
"""

    transcript_text = ""
    for entry in transcript:
        role = entry.get("role", "unknown")
        content = entry.get("content", "")
        transcript_text += f"{role.upper()}: {content}\n"

    prompt = f"""Analyze this mock interview and return a detailed JSON feedback report.

Interview Context: {interview_context}

Transcript:
---
{transcript_text[:8000]}
---

{emotion_summary}

Return a JSON object with:
- "overall_score": number 0-100
- "summary": 2-3 sentence overall assessment (string)
- "strengths": array of objects with "area" and "detail" fields
- "weaknesses": array of objects with "area" and "detail" fields  
- "suggestions": array of specific improvement tips (strings)
- "emotion_summary": object with "avg_stress", "avg_confidence", "dominant_mood", "body_language_notes"
- "question_breakdown": array of objects with "question", "response_quality" (good/fair/poor), "notes"

Return ONLY the JSON object."""

    result = await generate_text(prompt, system)

    result = result.strip()
    if result.startswith("```"):
        lines = result.split("\n")
        result = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {
            "overall_score": 0,
            "summary": "Unable to generate feedback. Please try again.",
            "strengths": [],
            "weaknesses": [],
            "suggestions": [],
            "emotion_summary": {},
            "question_breakdown": [],
            "raw_output": result,
        }
