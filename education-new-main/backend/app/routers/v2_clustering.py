from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.models_v2 import KnowledgeBand, DiagnosticQuizItem
from app.schemas_v2 import (
    DiagnosticQuizItemOut,
    DiagnosticQuizSubmit,
    KnowledgeBandOut,
    BandedMaterialRequest,
    BandedMaterialOut
)
from app.auth import get_current_user
from app.services.v2_services import evaluate_diagnostic_quiz, get_banded_study_material
from app.seed_v2_data import seed_diagnostic_items

router = APIRouter(prefix="/api/v2/clustering", tags=["v2_clustering"])


@router.get("/topics")
def get_available_topics(db: Session = Depends(get_db)):
    """Returns list of topics available for diagnostic pre-testing."""
    seed_diagnostic_items(db)
    topics_raw = db.query(
        DiagnosticQuizItem.topic_id,
        DiagnosticQuizItem.topic_name
    ).distinct().all()

    results = []
    for tid, tname in topics_raw:
        count = db.query(DiagnosticQuizItem).filter(DiagnosticQuizItem.topic_id == tid).count()
        results.append({
            "topic_id": tid,
            "topic_name": tname,
            "question_count": count
        })
    return results


@router.get("/quiz/{topic_id}", response_model=List[DiagnosticQuizItemOut])
def get_diagnostic_quiz(topic_id: str, db: Session = Depends(get_db)):
    """Fetches diagnostic quiz items (5-8 questions) for a topic."""
    seed_diagnostic_items(db)
    items = db.query(DiagnosticQuizItem).filter(DiagnosticQuizItem.topic_id == topic_id).all()
    if not items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No diagnostic quiz found for topic '{topic_id}'"
        )
    return items


@router.post("/submit-quiz", response_model=KnowledgeBandOut)
def submit_diagnostic_quiz(
    payload: DiagnosticQuizSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submits answers, grades quiz, and auto-assigns knowledge band."""
    seed_diagnostic_items(db)
    band_record = evaluate_diagnostic_quiz(
        db=db,
        user_id=current_user.id,
        topic_id=payload.topic_id,
        answers=payload.answers,
        topic_name=payload.topic_name or "Topic"
    )
    return band_record


@router.get("/my-band/{topic_id}", response_model=Optional[KnowledgeBandOut])
def get_my_band_for_topic(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves current student's assigned band for a specific topic."""
    band = db.query(KnowledgeBand).filter(
        KnowledgeBand.user_id == current_user.id,
        KnowledgeBand.topic_id == topic_id
    ).first()
    return band


@router.get("/my-bands", response_model=List[KnowledgeBandOut])
def get_my_bands(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all assigned knowledge bands for current student."""
    return db.query(KnowledgeBand).filter(
        KnowledgeBand.user_id == current_user.id
    ).order_by(KnowledgeBand.assigned_at.desc()).all()


@router.post("/banded-material", response_model=BandedMaterialOut)
def generate_banded_material(
    payload: BandedMaterialRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlocks study material adapted to student's knowledge band depth and pacing."""
    result = get_banded_study_material(
        db=db,
        user_id=current_user.id,
        topic_id=payload.topic_id,
        original_text=payload.original_text,
        topic_name=payload.topic_name or payload.topic_id
    )
    return result
