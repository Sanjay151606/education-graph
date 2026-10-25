from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db
from app.services import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/recommendations", response_model=schemas.RecommendationOut)
def recommendations(
    req: schemas.RecommendationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    logs = db.query(models.ProgressLog).filter(
        models.ProgressLog.user_id == current_user.id
    ).order_by(models.ProgressLog.date.desc()).limit(10).all()

    scores = [l.score for l in logs if l.score is not None]

    result = ai_service.generate_recommendations(
        recent_scores=scores,
        focus_span_minutes=current_user.focus_span_minutes,
        preferred_style=current_user.preferred_content_style,
        subject=req.subject,
    )
    return result


@router.post("/focus-session/{session_id}/feedback")
def focus_feedback(
    session_id: str,
    distractions_logged: int,
    planned_minutes: int,
    actual_minutes: int,
):
    risk = ai_service.detect_distraction_risk(distractions_logged, planned_minutes, actual_minutes)
    return {"risk_label": risk}
