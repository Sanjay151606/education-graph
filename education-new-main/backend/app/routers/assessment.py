import os
import re
from datetime import datetime
from typing import List, Optional, Dict, Any
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, AssessmentItem, AssessmentSession, AssessmentResponse
from ..schemas import (
    AssessmentStartRequest,
    AssessmentStartResponse,
    AssessmentItemOut,
    AssessmentResponseCreate,
    AssessmentResponseOut,
    AssessmentSessionOut,
    AssessmentResultsOut,
    TabSwitchRequest,
    AudioUploadResponse
)
from ..auth import get_current_user
from ..seed_full_assessment import seed_full_assessment
from ..services.ai_service import ai_service
from ..config import settings

router = APIRouter(prefix="/api/assessment", tags=["assessment"])

# Audio storage directory for local fallback
AUDIO_UPLOAD_DIR = os.path.join(os.getcwd(), "backend", "uploads", "audio")
os.makedirs(AUDIO_UPLOAD_DIR, exist_ok=True)


def normalize_text(text: str) -> str:
    """Normalizes punctuation, whitespace, and casing for fair evaluation."""
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    return re.sub(r'\s+', ' ', text)


@router.post("/start", response_model=AssessmentStartResponse, status_code=status.HTTP_201_CREATED)
def start_assessment(
    req: Optional[AssessmentStartRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initializes a new assessment session with candidate name and returns Section A items."""
    # Ensure full item bank is seeded
    seed_full_assessment(db)

    candidate_name = (req.candidate_name if req and req.candidate_name else current_user.full_name or "Candidate").strip()

    # Create new session
    session = AssessmentSession(
        user_id=current_user.id,
        candidate_name=candidate_name,
        status="in_progress",
        current_section="A",
        started_at=datetime.utcnow(),
        tab_switch_count=0,
        warnings=[]
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Fetch Section A items ordered by sequence
    items = db.query(AssessmentItem).filter(
        AssessmentItem.section == "A"
    ).order_by(AssessmentItem.sequence_index.asc()).all()

    return {
        "session_id": session.id,
        "current_section": "A",
        "candidate_name": session.candidate_name,
        "items": items
    }


@router.get("/{session_id}/section/{section}", response_model=List[AssessmentItemOut])
def get_section_items(
    session_id: uuid.UUID,
    section: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches items for a specific section (A, B, C, or D) in sequence order without leaking answers."""
    section_upper = section.upper()
    if section_upper not in ["A", "B", "C", "D"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid section. Must be A, B, C, or D.")

    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == session_id,
        AssessmentSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")

    session.current_section = section_upper
    db.commit()

    items = db.query(AssessmentItem).filter(
        AssessmentItem.section == section_upper
    ).order_by(AssessmentItem.sequence_index.asc()).all()

    return items


@router.post("/{session_id}/respond", response_model=AssessmentResponseOut)
def record_response(
    session_id: uuid.UUID,
    resp_in: AssessmentResponseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Records an MCQ choice or response metadata with server-side grading."""
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == session_id,
        AssessmentSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")

    item = db.query(AssessmentItem).filter(AssessmentItem.id == resp_in.item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment item not found")

    # Evaluate correctness server-side if item is an auto-gradable MCQ
    is_correct = None
    similarity = None

    if item.item_type in ["grammar_mcq", "listening_comprehension"]:
        submitted = (resp_in.mcq_choice or resp_in.user_answer_text or "").strip()
        correct = (item.correct_answer or "").strip()
        if submitted and correct:
            is_correct = normalize_text(submitted) == normalize_text(correct)
            similarity = 1.0 if is_correct else 0.0

    # Upsert response for this item & session
    response = db.query(AssessmentResponse).filter(
        AssessmentResponse.session_id == session.id,
        AssessmentResponse.item_id == item.id
    ).first()

    if not response:
        response = AssessmentResponse(
            session_id=session.id,
            item_id=item.id,
            response_type="mcq_choice" if item.item_type in ["grammar_mcq", "listening_comprehension"] else "audio",
            user_answer_text=resp_in.user_answer_text,
            mcq_choice=resp_in.mcq_choice,
            response_time_ms=resp_in.response_time_ms,
            is_correct=is_correct,
            similarity_score=similarity
        )
        db.add(response)
    else:
        if resp_in.user_answer_text is not None:
            response.user_answer_text = resp_in.user_answer_text
        if resp_in.mcq_choice is not None:
            response.mcq_choice = resp_in.mcq_choice
        if resp_in.response_time_ms is not None:
            response.response_time_ms = resp_in.response_time_ms
        response.is_correct = is_correct
        response.similarity_score = similarity

    db.commit()
    db.refresh(response)

    return response


@router.post("/{session_id}/upload-audio", response_model=AudioUploadResponse)
async def upload_audio_recording(
    session_id: uuid.UUID,
    item_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads recorded audio for Section A/B speaking tasks to Supabase Storage (with local fallback)."""
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == session_id,
        AssessmentSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")

    item = db.query(AssessmentItem).filter(AssessmentItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment item not found")

    # Generate storage key: {user_id}/{session_id}/{item_id}.webm
    filename = f"{item_id}.webm"
    storage_key = f"{str(current_user.id)}/{str(session_id)}/{filename}"

    content = await file.read()

    # Attempt Supabase Storage upload if credentials are provided
    uploaded_to_supabase = False
    if settings.supabase_url and settings.supabase_key:
        try:
            from supabase import create_client
            supabase_client = create_client(settings.supabase_url, settings.supabase_key)
            # Ensure bucket exists or upload directly
            res = supabase_client.storage.from_("assessment-audio").upload(
                file=content,
                path=storage_key,
                file_options={"content-type": "audio/webm", "upsert": "true"}
            )
            uploaded_to_supabase = True
        except Exception:
            uploaded_to_supabase = False

    # Always persist locally as well for seamless fallback & dev testing
    user_session_dir = os.path.join(AUDIO_UPLOAD_DIR, str(current_user.id), str(session_id))
    os.makedirs(user_session_dir, exist_ok=True)
    file_path = os.path.join(user_session_dir, filename)
    with open(file_path, "wb") as f:
        f.write(content)

    # Update or create AssessmentResponse with audio path
    response = db.query(AssessmentResponse).filter(
        AssessmentResponse.session_id == session.id,
        AssessmentResponse.item_id == item.id
    ).first()

    if not response:
        response = AssessmentResponse(
            session_id=session.id,
            item_id=item.id,
            response_type="audio",
            audio_storage_path=storage_key
        )
        db.add(response)
    else:
        response.audio_storage_path = storage_key
        response.response_type = "audio"

    db.commit()

    return {
        "session_id": session.id,
        "item_id": item.id,
        "audio_storage_path": storage_key,
        "message": "Audio recording uploaded successfully"
    }


@router.get("/audio/{user_id}/{session_id}/{filename}")
def stream_audio_file(
    user_id: str,
    session_id: str,
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Serves uploaded assessment audio for student review."""
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to recording")

    file_path = os.path.join(AUDIO_UPLOAD_DIR, user_id, session_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio recording not found")

    return FileResponse(file_path, media_type="audio/webm", filename=filename)


@router.post("/{session_id}/tab-switch")
def record_tab_switch(
    session_id: uuid.UUID,
    req: Optional[TabSwitchRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Increments tab switch count and logs proctoring warning timestamp across all sections."""
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == session_id,
        AssessmentSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")

    session.tab_switch_count += 1
    current_warnings = list(session.warnings or [])
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    current_warnings.append(f"Tab switch detected at {timestamp}")
    session.warnings = current_warnings
    db.commit()

    return {
        "session_id": session.id,
        "tab_switch_count": session.tab_switch_count,
        "warnings": session.warnings,
        "status": "warning_logged"
    }


@router.post("/{session_id}/complete", response_model=AssessmentResultsOut)
def complete_assessment_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Concludes the 4-section assessment, auto-grades C & D, and calls AI for non-diagnostic summary."""
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == session_id,
        AssessmentSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")

    responses = db.query(AssessmentResponse).filter(AssessmentResponse.session_id == session.id).all()
    resp_map = {r.item_id: r for r in responses}

    # Pull all items by section
    all_items = db.query(AssessmentItem).all()
    sec_c_items = [it for it in all_items if it.section == "C"]
    sec_d_items = [it for it in all_items if it.section == "D" and it.correct_answer is not None]
    audio_items = [it for it in all_items if it.section in ["A", "B"]]

    # Score Section C
    c_correct = sum(1 for it in sec_c_items if it.id in resp_map and resp_map[it.id].is_correct)
    c_total = len(sec_c_items)
    c_score = round((c_correct / max(1, c_total)) * 100.0, 1)

    # Score Section D
    d_correct = sum(1 for it in sec_d_items if it.id in resp_map and resp_map[it.id].is_correct)
    d_total = len(sec_d_items)
    d_score = round((d_correct / max(1, d_total)) * 100.0, 1)

    # Count audio items recorded
    audio_recorded_count = sum(1 for it in audio_items if it.id in resp_map and resp_map[it.id].audio_storage_path)

    # Generate AI summary
    ai_summary_data = ai_service.summarize_assessment_session(
        section_c_score=c_score,
        section_d_score=d_score,
        speaking_items_count=audio_recorded_count,
        tab_switch_count=session.tab_switch_count,
        candidate_name=session.candidate_name or current_user.full_name or "Candidate"
    )

    per_section = {
        "section_a": {
            "title": "Reading & Listening",
            "items_count": len([it for it in all_items if it.section == "A"]),
            "audio_recorded": sum(1 for it in all_items if it.section == "A" and it.id in resp_map and resp_map[it.id].audio_storage_path),
            "status": "Pending Instructor Review"
        },
        "section_b": {
            "title": "Speaking Tasks",
            "items_count": len([it for it in all_items if it.section == "B"]),
            "audio_recorded": sum(1 for it in all_items if it.section == "B" and it.id in resp_map and resp_map[it.id].audio_storage_path),
            "status": "Pending Instructor Review"
        },
        "section_c": {
            "title": "Grammar Accuracy",
            "correct_count": c_correct,
            "total_count": c_total,
            "accuracy_percentage": c_score,
            "status": "Auto-Graded"
        },
        "section_d": {
            "title": "Listening Comprehension",
            "correct_count": d_correct,
            "total_count": d_total,
            "accuracy_percentage": d_score,
            "status": "Auto-Graded"
        }
    }

    session.status = "completed"
    session.completed_at = datetime.utcnow()
    session.overall_score = ai_summary_data["auto_graded_score"]
    session.ai_summary = ai_summary_data["ai_summary"]
    session.per_type_breakdown = per_section
    db.commit()

    audio_urls = {
        r.item_id: f"/api/assessment/audio/{str(current_user.id)}/{str(session.id)}/{r.item_id}.webm"
        for r in responses if r.audio_storage_path
    }

    return {
        "session_id": session.id,
        "candidate_name": session.candidate_name,
        "status": session.status,
        "overall_score": session.overall_score,
        "auto_graded_score": ai_summary_data["auto_graded_score"],
        "tab_switch_count": session.tab_switch_count,
        "per_section_breakdown": per_section,
        "ai_summary": session.ai_summary,
        "audio_review_urls": audio_urls,
        "recommended_focus_span_minutes": ai_summary_data["recommended_focus_span_minutes"],
        "recommended_content_style": ai_summary_data["recommended_content_style"],
        "recommended_difficulty_level": ai_summary_data["recommended_difficulty_level"]
    }


@router.get("/{session_id}/results", response_model=AssessmentResultsOut)
def get_assessment_results(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches completed assessment results, scores, and audio review paths."""
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == session_id,
        AssessmentSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")

    responses = db.query(AssessmentResponse).filter(AssessmentResponse.session_id == session.id).all()
    audio_urls = {
        r.item_id: f"/api/assessment/audio/{str(current_user.id)}/{str(session.id)}/{r.item_id}.webm"
        for r in responses if r.audio_storage_path
    }

    return {
        "session_id": session.id,
        "candidate_name": session.candidate_name,
        "status": session.status,
        "overall_score": session.overall_score or 0.0,
        "auto_graded_score": session.overall_score or 0.0,
        "tab_switch_count": session.tab_switch_count,
        "per_section_breakdown": session.per_type_breakdown or {},
        "ai_summary": session.ai_summary or "Assessment completed.",
        "audio_review_urls": audio_urls,
        "recommended_focus_span_minutes": 25,
        "recommended_content_style": "visual",
        "recommended_difficulty_level": "adaptive"
    }


@router.get("/history", response_model=List[AssessmentSessionOut])
def get_assessment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns past assessment sessions for the current user."""
    return db.query(AssessmentSession).filter(
        AssessmentSession.user_id == current_user.id,
        AssessmentSession.status == "completed"
    ).order_by(AssessmentSession.completed_at.desc()).all()
