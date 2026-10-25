from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, FocusSession, ProgressLog
from ..schemas import FocusSessionCreate, FocusSessionUpdate, FocusSessionOut
from ..auth import get_current_user
from ..services.ai_service import ai_service

router = APIRouter(prefix="/api/focus-sessions", tags=["focus-sessions"])

@router.post("", response_model=FocusSessionOut, status_code=status.HTTP_201_CREATED)
def create_focus_session(
    session_in: FocusSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new focus session when user starts the timer."""
    session = FocusSession(
        user_id=current_user.id,
        task_id=session_in.task_id,
        target_minutes=session_in.target_minutes,
        actual_minutes=0,
        distractions_logged=0,
        distraction_notes=[],
        is_completed=False,
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.patch("/{session_id}", response_model=FocusSessionOut)
@router.put("/{session_id}", response_model=FocusSessionOut)
def update_focus_session(
    session_id: str,
    session_update: FocusSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates the focus session on Pause, Reset, or Complete with actual minutes and distraction logs."""
    session = db.query(FocusSession).filter(
        FocusSession.id == session_id,
        FocusSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found")

    update_data = session_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(session, key, value)

    if session_update.is_completed:
        session.ended_at = datetime.utcnow()
        # Evaluate risk label if not present
        if not session.risk_label:
            feedback = ai_service.analyze_focus_session(
                target_minutes=session.target_minutes,
                actual_minutes=session.actual_minutes,
                distractions_logged=session.distractions_logged,
                notes=session.distraction_notes or []
            )
            session.risk_label = feedback["risk_label"]
            session.feedback_notes = feedback["feedback_message"]

        # Update Daily Progress Log
        today = datetime.utcnow().date()
        daily_log = db.query(ProgressLog).filter(
            ProgressLog.user_id == current_user.id,
            ProgressLog.date == today
        ).first()

        if not daily_log:
            daily_log = ProgressLog(
                user_id=current_user.id,
                date=today,
                total_focus_minutes=session.actual_minutes,
                tasks_completed=1 if session.task_id else 0,
                cards_reviewed=0,
                distractions_count=session.distractions_logged
            )
            db.add(daily_log)
        else:
            daily_log.total_focus_minutes += session.actual_minutes
            daily_log.distractions_count += session.distractions_logged
            if session.task_id:
                daily_log.tasks_completed += 1

    db.commit()
    db.refresh(session)
    return session

@router.get("", response_model=List[FocusSessionOut])
def list_focus_sessions(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(FocusSession).filter(
        FocusSession.user_id == current_user.id
    ).order_by(FocusSession.started_at.desc()).limit(limit).all()
    return sessions

@router.get("/{session_id}", response_model=FocusSessionOut)
def get_focus_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(FocusSession).filter(
        FocusSession.id == session_id,
        FocusSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found")
    return session
