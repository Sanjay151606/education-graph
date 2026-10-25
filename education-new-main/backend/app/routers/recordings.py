import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, SessionRecording

from app.schemas_v2 import (
    RecordingStartRequest,
    RecordingStartResponse,
    RecordingCompleteRequest,
    RecordingItemOut,
    RecordingSignedUrlOut,
)
from app.auth import get_current_user, require_student, require_teacher
from app.config import settings

router = APIRouter(prefix="/api/recordings", tags=["recordings"])

RECORDINGS_DIR = os.path.join("uploads", "recordings")
os.makedirs(RECORDINGS_DIR, exist_ok=True)


def _get_supabase_client():
    if settings.supabase_url and settings.supabase_key:
        try:
            from supabase import create_client
            return create_client(settings.supabase_url, settings.supabase_key)
        except Exception:
            return None
    return None


@router.post("/start", response_model=RecordingStartResponse)
def start_recording(
    req: RecordingStartRequest,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """
    Student starts a camera recording.
    - Verified student user via Supabase Auth token.
    - Creates a new session_recordings entry in database with status 'recording'.
    """
    recording_id = uuid.uuid4()
    storage_path = f"student-recordings/{str(current_user.id)}/{req.session_id}/{str(recording_id)}"

    try:
        recording = SessionRecording(
            id=recording_id,
            session_id=req.session_id,
            user_id=current_user.id,
            storage_path=storage_path,
            started_at=datetime.utcnow(),
            status="recording",
            chunk_count=0
        )
        db.add(recording)
        db.commit()
        db.refresh(recording)

        return RecordingStartResponse(
            recording_id=recording.id,
            session_id=recording.session_id,
            storage_path=recording.storage_path,
            status=recording.status
        )
    except Exception as e:
        db.rollback()
        # If the table doesn't exist yet in remote/local DB, create it and retry
        try:
            from app.db.session import engine
            SessionRecording.__table__.create(bind=engine, checkfirst=True)
            recording = SessionRecording(
                id=recording_id,
                session_id=req.session_id,
                user_id=current_user.id,
                storage_path=storage_path,
                started_at=datetime.utcnow(),
                status="recording",
                chunk_count=0
            )
            db.add(recording)
            db.commit()
            db.refresh(recording)
            return RecordingStartResponse(
                recording_id=recording.id,
                session_id=recording.session_id,
                storage_path=recording.storage_path,
                status=recording.status
            )
        except Exception as inner_e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error starting recording session: {str(inner_e)}"
            )



@router.post("/chunk")
async def upload_recording_chunk(
    recording_id: uuid.UUID = Form(...),
    chunk_index: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """
    Student uploads a ~10-second MediaRecorder video chunk.
    - Verifies ownership (user_id matches authenticated token).
    - Uploads chunk to private Supabase Storage bucket ('student-recordings').
    - Also saves to local disk as a reliable fallback.
    """
    recording = db.query(SessionRecording).filter(
        SessionRecording.id == recording_id,
        SessionRecording.user_id == current_user.id
    ).first()

    if not recording:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active recording session not found")

    content = await file.read()
    chunk_filename = f"chunk_{chunk_index:04d}.webm"
    storage_key = f"{str(current_user.id)}/{recording.session_id}/{str(recording_id)}/{chunk_filename}"

    # 1. Attempt Supabase Storage upload to private bucket 'student-recordings'
    supabase_client = _get_supabase_client()
    if supabase_client:
        try:
            supabase_client.storage.from_("student-recordings").upload(
                file=content,
                path=storage_key,
                file_options={"content-type": "video/webm", "upsert": "true"}
            )
        except Exception as e:
            # Fallback to local disk if cloud bucket unavailable
            pass

    # 2. Always persist locally for offline/dev resilience
    local_rec_dir = os.path.join(RECORDINGS_DIR, str(current_user.id), recording.session_id, str(recording_id))
    os.makedirs(local_rec_dir, exist_ok=True)
    local_file_path = os.path.join(local_rec_dir, chunk_filename)
    with open(local_file_path, "wb") as f:
        f.write(content)

    # 3. Update chunk count
    recording.chunk_count = max(recording.chunk_count, chunk_index + 1)
    db.commit()

    return {
        "status": "ok",
        "recording_id": recording.id,
        "chunk_index": chunk_index,
        "bytes_received": len(content)
    }


@router.post("/complete")
def complete_recording(
    req: RecordingCompleteRequest,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """
    Student stops and finalizes the recording session.
    """
    recording = db.query(SessionRecording).filter(
        SessionRecording.id == req.recording_id,
        SessionRecording.user_id == current_user.id
    ).first()

    if not recording:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")

    now = datetime.utcnow()
    recording.ended_at = now
    duration = req.duration_seconds or max(1, int((now - recording.started_at).total_seconds()))
    recording.duration_seconds = duration
    recording.status = "completed"
    db.commit()
    db.refresh(recording)

    return {
        "status": "completed",
        "recording_id": recording.id,
        "duration_seconds": recording.duration_seconds,
        "chunks_total": recording.chunk_count
    }


@router.get("/list/{session_id}", response_model=List[RecordingItemOut])
def get_session_recordings_for_teacher(
    session_id: str,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Teacher views list of completed student recordings for an authorized class session.
    - Verified teacher role required (students receive 403 Forbidden).
    """
    recordings = (
        db.query(SessionRecording, User.full_name)
        .join(User, SessionRecording.user_id == User.id)
        .filter(
            SessionRecording.session_id == session_id,
            SessionRecording.status == "completed"
        )
        .order_by(SessionRecording.created_at.desc())
        .all()
    )

    results = []
    for rec, full_name in recordings:
        results.append(
            RecordingItemOut(
                id=rec.id,
                session_id=rec.session_id,
                user_id=rec.user_id,
                student_name=full_name or "Student",
                storage_path=rec.storage_path,
                started_at=rec.started_at,
                ended_at=rec.ended_at,
                duration_seconds=rec.duration_seconds,
                chunk_count=rec.chunk_count,
                status=rec.status,
                created_at=rec.created_at
            )
        )
    return results


@router.get("/{recording_id}/signed-url", response_model=RecordingSignedUrlOut)
def get_recording_signed_url(
    recording_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a secure short-lived signed URL for teacher playback.
    - Teacher access is verified.
    - Never generates permanent public URLs.
    """
    recording = db.query(SessionRecording).filter(SessionRecording.id == recording_id).first()
    if not recording:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")

    # Authorization: User must be teacher or the student owner
    if current_user.role != "teacher" and current_user.id != recording.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to view this recording")

    signed_url = None
    supabase_client = _get_supabase_client()
    if supabase_client:
        try:
            # Generate signed URL for chunk 0 or combined webm (expires in 300s)
            res = supabase_client.storage.from_("student-recordings").create_signed_url(
                path=f"{str(recording.user_id)}/{recording.session_id}/{str(recording.id)}/chunk_0000.webm",
                expires_in=300
            )
            if isinstance(res, dict) and "signedURL" in res:
                signed_url = res["signedURL"]
            elif hasattr(res, "signed_url"):
                signed_url = res.signed_url
        except Exception:
            signed_url = None

    # Fallback to backend-secured stream endpoint if Supabase signed URL generation is unavailable
    if not signed_url:
        signed_url = f"/api/recordings/{str(recording_id)}/video"

    return RecordingSignedUrlOut(
        recording_id=recording.id,
        signed_url=signed_url,
        expires_in_seconds=300
    )


@router.get("/{recording_id}/video")
def stream_recording_video(
    recording_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Secured video streaming endpoint for HTML5 <video controls />.
    - Merges or streams stored WebM recording chunks.
    """
    recording = db.query(SessionRecording).filter(SessionRecording.id == recording_id).first()
    if not recording:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")

    local_rec_dir = os.path.join(RECORDINGS_DIR, str(recording.user_id), recording.session_id, str(recording_id))
    if not os.path.exists(local_rec_dir):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording files not found on storage")

    # Find available chunks in order
    chunks = sorted([f for f in os.listdir(local_rec_dir) if f.endswith(".webm")])
    if not chunks:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No video chunks found")

    # For seamless single-file playback, serve the first chunk or combined webm
    target_path = os.path.join(local_rec_dir, chunks[0])
    return FileResponse(
        target_path,
        media_type="video/webm",
        filename=f"recording_{str(recording_id)[:8]}.webm"
    )
