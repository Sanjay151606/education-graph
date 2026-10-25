from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from pydantic import BaseModel, Field


# ==================== KNOWLEDGE CLUSTERING SCHEMAS ====================

class DiagnosticQuizItemOut(BaseModel):
    id: str
    topic_id: str
    topic_name: str
    question_text: str
    options: List[str]
    difficulty: str

    class Config:
        from_attributes = True


class DiagnosticQuizSubmit(BaseModel):
    topic_id: str
    topic_name: Optional[str] = "General Topic"
    answers: Dict[str, str]  # item_id -> chosen option


class KnowledgeBandOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    topic_id: str
    topic_name: str
    band: str  # "foundation" | "on-track" | "advanced"
    score: float
    assigned_at: datetime

    class Config:
        from_attributes = True


class BandedMaterialRequest(BaseModel):
    topic_id: str
    topic_name: Optional[str] = ""
    original_text: str


class BandedMaterialOut(BaseModel):
    topic_id: str
    topic_name: str
    band: str
    depth_level: str
    simplified_text: str
    summary_bullets: List[str]
    flashcards: List[Dict[str, Any]]
    challenge_questions: Optional[List[str]] = None


# ==================== CLASSROOM ENGAGEMENT SCHEMAS ====================

# All valid engagement states (camera-based + legacy WebSocket)
VALID_ENGAGEMENT_STATES = {
    # Camera engagement states (new)
    "focused",
    "possibly_confused",
    "possibly_disengaged",
    "no_face",
    "camera_off",
    "unknown",
    # Legacy WebSocket states
    "mild_confusion",
    "lost",
    "disengaged",
}


class EngagementEventCreate(BaseModel):
    session_id: str
    state: str  # See VALID_ENGAGEMENT_STATES
    confidence: float = 0.85
    metadata_payload: Optional[Dict[str, Any]] = None

    @classmethod
    def validate_state(cls, v: str) -> str:
        if v not in VALID_ENGAGEMENT_STATES:
            raise ValueError(f"Invalid state '{v}'. Must be one of: {sorted(VALID_ENGAGEMENT_STATES)}")
        return v


class AggregateEngagementTile(BaseModel):
    student_index: int       # Anonymous index e.g. 1..60
    state: str               # "focused" | "mild_confusion" | "lost" | "disengaged"
    color_code: str          # "green" | "yellow" | "red"
    last_updated_seconds_ago: int


class ClassAggregateSummary(BaseModel):
    session_id: str
    active_students_count: int
    focused_count: int
    mild_confusion_count: int
    lost_or_disengaged_count: int
    comprehension_rate_pct: float
    attention_rate_pct: float
    comprehension_drop_alert: bool
    alert_message: Optional[str] = None
    tiles: List[AggregateEngagementTile]


class ConfusionBookmarkCreate(BaseModel):
    session_id: str
    topic_or_slide: Optional[str] = "Live Lecture"
    note: Optional[str] = None


class ConfusionBookmarkOut(BaseModel):
    id: uuid.UUID
    session_id: str
    timestamp: datetime
    topic_or_slide: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== POST-CLASS FOLLOWUP SCHEMAS ====================

class PostClassFollowupOut(BaseModel):
    id: uuid.UUID
    session_id: Optional[str]
    type: str
    subtype: str  # "recap" | "challenge"
    title: str
    content: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ADHD PERSONALIZATION SCHEMAS ====================

class ADHDProfileOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    focus_span_avg_minutes: int
    preferred_break_interval: int
    reduced_stimulation_enabled: bool
    chunking_preference: str
    updated_at: datetime

    class Config:
        from_attributes = True


class ADHDProfileUpdate(BaseModel):
    preferred_break_interval: Optional[int] = None
    reduced_stimulation_enabled: Optional[bool] = None
    chunking_preference: Optional[str] = None


class LiveNotesChunkRequest(BaseModel):
    transcript_snippet: str
    topic: Optional[str] = "Lecture"


class LiveNotesChunkOut(BaseModel):
    timestamp: str
    key_points: List[str]
    takeaway_one_liner: str


# ==================== SESSION RECORDING SCHEMAS ====================

class RecordingStartRequest(BaseModel):
    session_id: str


class RecordingStartResponse(BaseModel):
    recording_id: uuid.UUID
    session_id: str
    storage_path: str
    status: str


class RecordingCompleteRequest(BaseModel):
    recording_id: uuid.UUID
    duration_seconds: int = 0


class RecordingItemOut(BaseModel):
    id: uuid.UUID
    session_id: str
    user_id: uuid.UUID
    student_name: Optional[str] = "Student"
    storage_path: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: int
    chunk_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RecordingSignedUrlOut(BaseModel):
    recording_id: uuid.UUID
    signed_url: str
    expires_in_seconds: int = 300

