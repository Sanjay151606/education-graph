import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FocusSessionBase(BaseModel):
    start_time: datetime = datetime.utcnow()
    end_time: Optional[datetime] = None
    duration: Optional[int] = None  # seconds
    interruptions: int = 0


class FocusSessionCreate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration: Optional[int] = None
    interruptions: int = 0


class FocusSessionUpdate(BaseModel):
    end_time: Optional[datetime] = None
    duration: Optional[int] = None
    interruptions: Optional[int] = None


class FocusSessionResponse(FocusSessionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
