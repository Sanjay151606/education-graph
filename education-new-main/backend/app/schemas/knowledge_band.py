import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.knowledge_band import BandLevel


class KnowledgeBandBase(BaseModel):
    subject: str
    band: BandLevel


class KnowledgeBandCreate(KnowledgeBandBase):
    pass


class KnowledgeBandUpdate(BaseModel):
    subject: Optional[str] = None
    band: Optional[BandLevel] = None


class KnowledgeBandResponse(KnowledgeBandBase):
    id: uuid.UUID
    user_id: uuid.UUID
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
