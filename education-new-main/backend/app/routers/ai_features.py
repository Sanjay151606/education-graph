import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.auth import get_current_user, require_teacher, require_student
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai_features"])


class PracticeQuizRequest(BaseModel):
    material_id: Optional[str] = None
    topic: Optional[str] = None
    band: Optional[str] = "on_track"


class DoubtSolveRequest(BaseModel):
    material_id: Optional[str] = None
    question: str
    chat_history: Optional[List[Dict[str, str]]] = None


@router.post("/practice-quiz")
def get_practice_quiz(
    payload: PracticeQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    1. Auto-generated practice quiz (5 questions) at student's knowledge band
    with instant feedback and explanations.
    """
    return ai_service.generate_practice_quiz(
        material_id=payload.material_id,
        topic=payload.topic,
        band=payload.band or "on_track",
        db=db,
    )


@router.post("/doubt-solver")
def solve_student_doubt(
    payload: DoubtSolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    2. Doubt-solving chat assistant: answers in a plain-language, ADHD-friendly chunked tone.
    """
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    # Section A: Log student doubt activity
    try:
        from app.services import activity_service
        activity_service.log_activity(
            user_id=current_user.id,
            activity_type="doubt_asked",
            reference_id=payload.material_id,
            metadata={"question": payload.question[:100]},
            db=db,
        )
    except Exception:
        pass

    return ai_service.solve_doubt(
        material_id=payload.material_id,
        question=payload.question,
        chat_history=payload.chat_history,
        db=db,
    )


@router.get("/weekly-digest/{user_id}")
def get_weekly_digest(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    3. Weekly AI progress digest: plain-language summary of week's tasks, scores, focus patterns.
    """
    return ai_service.generate_weekly_progress_digest(user_id=user_id, db=db)


@router.get("/strengths-weaknesses/{user_id}")
def get_strengths_and_weaknesses(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    4. Strength/weakness topic mapping: surfaces 2–3 strong topics and 2–3 growth areas.
    """
    return ai_service.map_strengths_and_weaknesses(user_id=user_id, db=db)


@router.get("/teacher-insights")
def get_teacher_class_insights(
    class_session_id: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """
    5. Teacher-facing class insight generator: aggregates knowledge-band distribution
    and common weak topics for lesson planning.
    """
    return ai_service.generate_teacher_class_insights(
        class_session_id=class_session_id,
        topic=topic,
        db=db,
    )
