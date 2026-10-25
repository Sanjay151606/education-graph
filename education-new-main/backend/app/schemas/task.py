import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.task import TaskPriority, TaskStatus


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    status: TaskStatus = TaskStatus.PENDING


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    status: Optional[TaskStatus] = None


class TaskResponse(TaskBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
