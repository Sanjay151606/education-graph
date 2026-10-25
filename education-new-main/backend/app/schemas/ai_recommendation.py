import uuid
from datetime import datetime
from typing import Any, Dict
from pydantic import BaseModel, ConfigDict


class AIRecommendationBase(BaseModel):
    type: str
    content: Dict[str, Any]


class AIRecommendationCreate(AIRecommendationBase):
    pass


class AIRecommendationResponse(AIRecommendationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
