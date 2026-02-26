"""
Resume upload and parsing router.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from schemas import ResumeAnalysis, CustomInterviewConfig
from services.resume_parser import extract_text_from_pdf
from services.gemini_text import parse_resume_with_ai

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("/upload", response_model=ResumeAnalysis)
async def upload_resume(file: UploadFile = File(...)):
    """Upload a PDF resume, extract text, and return structured analysis."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        raw_text = extract_text_from_pdf(contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    # Use AI to structure the resume
    structured = await parse_resume_with_ai(raw_text)

    return ResumeAnalysis(raw_text=raw_text, structured=structured)


@router.post("/analyze")
async def analyze_for_interview(config: CustomInterviewConfig):
    """Analyze resume + job description to generate custom interview config."""
    if not config.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text is required")
    if not config.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    structured = await parse_resume_with_ai(config.resume_text)

    return {
        "resume_structured": structured,
        "job_title": config.job_title or "Software Engineer",
        "ready": True,
    }
