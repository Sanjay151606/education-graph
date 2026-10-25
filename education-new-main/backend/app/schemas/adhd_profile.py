import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict


class ADHDProfileBase(BaseModel):
    peak_focus_hours: List[int] = []
    preferred_chunk_size: int = 20  # minutes
    sensory_preferences: Dict[str, Any] = {}


class ADHDProfileCreate(ADHDProfileBase):
    pass


class ADHDProfileUpdate(BaseModel):
    peak_focus_hours: Optional[List[int]] = None
    preferred_chunk_size: Optional[int] = None
    sensory_preferences: Optional[Dict[str, Any]] = None


class ADHDProfileResponse(ADHDProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
