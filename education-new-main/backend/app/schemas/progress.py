import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProgressBase(BaseModel):
    subject: str
    score: float
    date: datetime = datetime.utcnow()


class ProgressCreate(BaseModel):
    subject: str
    score: float
    date: Optional[datetime] = None


class ProgressUpdate(BaseModel):
    subject: Optional[str] = None
    score: Optional[float] = None
    date: Optional[datetime] = None


class ProgressResponse(ProgressBase):
    id: uuid.UUID
    user_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
