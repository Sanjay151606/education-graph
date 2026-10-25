from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.post("/", response_model=schemas.ProgressOut)
def log_progress(
    entry: schemas.ProgressCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    log = models.ProgressLog(user_id=current_user.id, **entry.dict())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/", response_model=List[schemas.ProgressOut])
def get_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.ProgressLog).filter(
        models.ProgressLog.user_id == current_user.id
    ).order_by(models.ProgressLog.date.desc()).all()
