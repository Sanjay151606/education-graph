from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.models_v2 import ADHDProfile
from app.schemas_v2 import (
    ADHDProfileOut,
    ADHDProfileUpdate,
    LiveNotesChunkRequest,
    LiveNotesChunkOut
)
from app.auth import get_current_user
from app.services.v2_services import analyze_focus_pattern, chunk_live_lecture_transcript

router = APIRouter(prefix="/api/v2/adhd", tags=["v2_adhd"])


@router.get("/profile", response_model=ADHDProfileOut)
def get_adhd_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves current student's ADHD personalization profile."""
    profile = db.query(ADHDProfile).filter(ADHDProfile.user_id == current_user.id).first()
    if not profile:
        profile = analyze_focus_pattern(db, current_user.id)
    return profile


@router.patch("/profile", response_model=ADHDProfileOut)
def update_adhd_profile(
    updates: ADHDProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates ADHD profile preferences (e.g. reduced stimulation mode, break intervals)."""
    profile = db.query(ADHDProfile).filter(ADHDProfile.user_id == current_user.id).first()
    if not profile:
        profile = ADHDProfile(user_id=current_user.id)
        db.add(profile)

    if updates.preferred_break_interval is not None:
        profile.preferred_break_interval = updates.preferred_break_interval
    if updates.reduced_stimulation_enabled is not None:
        profile.reduced_stimulation_enabled = updates.reduced_stimulation_enabled
    if updates.chunking_preference is not None:
        profile.chunking_preference = updates.chunking_preference

    db.commit()
    db.refresh(profile)
    return profile


@router.post("/analyze-pattern", response_model=ADHDProfileOut)
def trigger_focus_pattern_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyzes historical focus events to compute student's personalized
    attention baseline and ideal break interval.
    """
    return analyze_focus_pattern(db, current_user.id)


@router.post("/live-notes/chunk", response_model=LiveNotesChunkOut)
def chunk_live_lecture_notes(payload: LiveNotesChunkRequest):
    """
    Converts a ~30-second live transcription feed into short, digestible bullet points
    so students who lose track can catch up without disruption.
    """
    return chunk_live_lecture_transcript(payload.transcript_snippet, payload.topic or "Live Lecture")
