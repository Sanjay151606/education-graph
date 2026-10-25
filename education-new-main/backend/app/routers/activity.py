import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.auth import get_current_user
from app.services import activity_service

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/{user_id}")
def get_student_activity_timeline(
    user_id: uuid.UUID,
    range: str = Query("week", pattern="^(today|week|month)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves student activity timeline grouped by day.
    """
    return activity_service.get_activity_timeline(user_id=user_id, range_filter=range, db=db)


@router.get("/{user_id}/streak")
def get_student_streak(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves student consecutive active days streak.
    """
    return activity_service.get_streak(user_id=user_id, db=db)
