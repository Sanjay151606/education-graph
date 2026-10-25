import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class EngagementEventBase(BaseModel):
    event_type: str
    metadata_payload: Dict[str, Any] = Field(default_factory=dict, alias="metadata")


class EngagementEventCreate(BaseModel):
    event_type: str
    metadata_payload: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="metadata")
    occurred_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


class EngagementEventResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    event_type: str
    metadata_payload: Dict[str, Any] = Field(..., alias="metadata")
    occurred_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
