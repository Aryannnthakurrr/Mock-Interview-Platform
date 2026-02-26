"""
Code execution router using Judge0 SDK.
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

import judge0

router = APIRouter(prefix="/api/code", tags=["code"])
logger = logging.getLogger(__name__)

# Build language map from available judge0 constants
LANGUAGE_MAP = {}
for _name, _key in [
    ("PYTHON", "python"),
    ("JAVASCRIPT", "javascript"),
    ("JAVA", "java"),
    ("CPP", "cpp"),
    ("C", "c"),
    ("TYPESCRIPT", "typescript"),
]:
    _val = getattr(judge0, _name, None)
    if _val is not None:
        LANGUAGE_MAP[_key] = _val

if not LANGUAGE_MAP:
    logger.warning("No Judge0 language constants found — code execution may not work.")


class CodeRunRequest(BaseModel):
    source_code: str
    language: str = "python"
    stdin: Optional[str] = ""


class CodeRunResponse(BaseModel):
    stdout: str = ""
    stderr: str = ""
    compile_output: str = ""
    status: str = ""
    time: Optional[str] = None
    memory: Optional[int] = None


@router.post("/run", response_model=CodeRunResponse)
def run_code(req: CodeRunRequest):
    """Execute code using Judge0."""
    lang = LANGUAGE_MAP.get(req.language.lower())
    if not lang:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{req.language}'. Supported: {list(LANGUAGE_MAP.keys())}",
        )

    try:
        result = judge0.run(
            source_code=req.source_code,
            stdin=req.stdin or "",
            language=lang,
        )

        # Extract status description safely
        status_desc = "Completed"
        if hasattr(result, "status"):
            s = result.status
            if hasattr(s, "description"):
                status_desc = s.description
            elif isinstance(s, dict):
                status_desc = s.get("description", str(s))
            else:
                status_desc = str(s)

        return CodeRunResponse(
            stdout=getattr(result, "stdout", "") or "",
            stderr=getattr(result, "stderr", "") or "",
            compile_output=getattr(result, "compile_output", "") or "",
            status=status_desc,
            time=str(getattr(result, "time", "")) if getattr(result, "time", None) is not None else None,
            memory=getattr(result, "memory", None),
        )
    except Exception as e:
        logger.error(f"Code execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Code execution failed: {str(e)}")
