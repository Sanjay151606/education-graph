from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, auth
from app.database import get_db
from app.services import ai_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("/", response_model=schemas.TaskOut)
def create_task(
    task_in: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    subtasks, estimated_minutes = [], None
    if task_in.auto_breakdown:
        result = ai_service.break_down_task(task_in.title, task_in.description or "")
        subtasks = result.get("subtasks", [])
        estimated_minutes = result.get("estimated_minutes_total")

    task = models.Task(
        user_id=current_user.id,
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority,
        due_date=task_in.due_date,
        subtasks=subtasks,
        estimated_minutes=estimated_minutes,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/", response_model=List[schemas.TaskOut])
def list_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Task).filter(models.Task.user_id == current_user.id).all()


@router.patch("/{task_id}/status")
def update_status(
    task_id: str,
    status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id, models.Task.user_id == current_user.id
    ).first()
    if task:
        task.status = status
        db.commit()

        # Section A: Auto-generate report when task is marked complete
        if status.lower() == "done":
            try:
                from app.services import notification_service, activity_service
                notification_service.generate_report(
                    user_id=current_user.id,
                    task_id=task.id,
                    db=db,
                )
                activity_service.log_activity(
                    user_id=current_user.id,
                    activity_type="task_completed",
                    reference_id=task.id,
                    metadata={"title": task.title},
                    db=db,
                )
            except Exception as notify_err:
                print(f"[tasks.py] Auto report/activity generation warning: {notify_err}")

    return {"ok": True}
