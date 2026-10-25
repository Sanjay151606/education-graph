# ─── Canonical Pydantic Schemas for BrainGraph API ────────────────────────────
# This package is the single source of truth for all schemas used by the routers.
# The flat schemas.py file is superseded by this package (Python loads the
# package directory first when both exist).

import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr


# ─── Auth / User ──────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str = ""
    name: Optional[str] = None
    role: str = "student"
    status: str = "active"
    focus_span_minutes: int = 20
    preferred_content_style: str = "visual"
    difficulty_level: str = "adaptive"
    reminders_enabled: bool = True
    phone_number: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone_number: Optional[str] = None
    notify_on_completion: bool = True

    class Config:
        from_attributes = True


class UserUpdateProfile(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None
    focus_span_minutes: Optional[int] = None
    preferred_content_style: Optional[str] = None
    difficulty_level: Optional[str] = None
    reminders_enabled: Optional[bool] = None
    phone_number: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone_number: Optional[str] = None
    notify_on_completion: Optional[bool] = None


# ─── Reports ──────────────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    user_id: uuid.UUID
    task_id: Optional[uuid.UUID] = None
    session_id: Optional[uuid.UUID] = None
    summary: str
    score: Optional[float] = None
    sent_via: Optional[str] = "both"
    sent_status: Optional[str] = "pending"


class ReportOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    task_id: Optional[uuid.UUID] = None
    session_id: Optional[uuid.UUID] = None
    summary: str
    score: Optional[float] = None
    sent_via: str = "both"
    sent_status: str = "pending"
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Tasks ────────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[datetime] = None
    auto_breakdown: bool = True   # let AI split into subtasks


class TaskOut(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    subtasks: List[Any] = []
    priority: str
    status: str
    estimated_minutes: Optional[int] = None
    due_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Study Materials ──────────────────────────────────────────────────────────
from app.schemas.study_material import (
    StudyMaterialBase,
    StudyMaterialCreate,
    StudyMaterialUpdate,
    StudyMaterialOut,
    MaterialSignedUrlOut,
)

# Backward-compatibility aliases
MaterialCreate = StudyMaterialCreate
MaterialOut = StudyMaterialOut



# ─── Progress ─────────────────────────────────────────────────────────────────

class ProgressCreate(BaseModel):
    subject: Optional[str] = None
    activity_type: str
    score: Optional[float] = None
    time_spent_minutes: Optional[int] = None


class ProgressOut(ProgressCreate):
    id: uuid.UUID
    date: datetime

    class Config:
        from_attributes = True


# ─── AI / Recommendations ─────────────────────────────────────────────────────

class RecommendationRequest(BaseModel):
    subject: Optional[str] = None


class RecommendationOut(BaseModel):
    recommendations: List[str]
    suggested_focus_minutes: int
    suggested_break_minutes: int
    motivational_note: str


# ─── Assessment ───────────────────────────────────────────────────────────────

class AssessmentStartRequest(BaseModel):
    candidate_name: Optional[str] = "Candidate"


class AssessmentItemOut(BaseModel):
    id: str
    section: str
    item_type: str
    sequence_index: int
    prompt_text: str
    options: Optional[List[str]] = None
    hints: Optional[List[str]] = None
    time_limit_seconds: Optional[int] = None
    passage_group_id: Optional[str] = None
    difficulty: Optional[str] = None

    class Config:
        from_attributes = True


class AssessmentStartResponse(BaseModel):
    session_id: uuid.UUID
    current_section: str
    candidate_name: Optional[str] = None
    items: List[AssessmentItemOut]


class AssessmentResponseCreate(BaseModel):
    item_id: str
    mcq_choice: Optional[str] = None
    user_answer_text: Optional[str] = None
    response_time_ms: Optional[int] = None


class AssessmentResponseOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    item_id: str
    response_type: str
    mcq_choice: Optional[str] = None
    is_correct: Optional[bool] = None
    similarity_score: Optional[float] = None
    response_time_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TabSwitchRequest(BaseModel):
    reason: Optional[str] = "Tab switched or window lost focus"


class AudioUploadResponse(BaseModel):
    session_id: uuid.UUID
    item_id: str
    audio_storage_path: str
    message: str


class AssessmentSessionOut(BaseModel):
    id: uuid.UUID
    candidate_name: Optional[str] = None
    status: str
    current_section: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    tab_switch_count: int
    warnings: List[Any] = []
    overall_score: Optional[float] = None
    ai_summary: Optional[str] = None

    class Config:
        from_attributes = True


class AssessmentResultsOut(BaseModel):
    session_id: uuid.UUID
    candidate_name: Optional[str] = None
    status: str
    overall_score: Optional[float] = None
    auto_graded_score: Optional[float] = None
    tab_switch_count: int = 0
    per_section_breakdown: dict = {}
    ai_summary: Optional[str] = None
    audio_review_urls: dict = {}
    recommended_focus_span_minutes: Optional[int] = 25
    recommended_content_style: Optional[str] = "visual"
    recommended_difficulty_level: Optional[str] = "adaptive"

    class Config:
        from_attributes = True


# ─── v2 Schemas — re-exported from sub-modules ────────────────────────────────
from app.schemas.adhd_profile import ADHDProfileCreate, ADHDProfileUpdate, ADHDProfileResponse as ADHDProfileOut  # noqa: E402
from app.schemas.engagement_event import EngagementEventCreate, EngagementEventResponse  # noqa: E402
from app.schemas.knowledge_band import KnowledgeBandCreate, KnowledgeBandUpdate, KnowledgeBandResponse  # noqa: E402
from app.schemas.ai_recommendation import AIRecommendationCreate, AIRecommendationResponse  # noqa: E402
from app.schemas.focus_session import FocusSessionCreate, FocusSessionUpdate, FocusSessionResponse  # noqa: E402


__all__ = [
    # Auth
    "UserOut",
    "UserUpdateProfile",
    # Tasks
    "TaskCreate",
    "TaskOut",
    # Study Materials
    "MaterialCreate",
    "MaterialOut",
    # Progress
    "ProgressCreate",
    "ProgressOut",
    # AI
    "RecommendationRequest",
    "RecommendationOut",
    # Assessment
    "AssessmentStartRequest",
    "AssessmentItemOut",
    "AssessmentStartResponse",
    "AssessmentResponseCreate",
    "AssessmentResponseOut",
    "TabSwitchRequest",
    "AudioUploadResponse",
    "AssessmentSessionOut",
    "AssessmentResultsOut",
    # v2
    "ADHDProfileCreate",
    "ADHDProfileUpdate",
    "ADHDProfileOut",
    "EngagementEventCreate",
    "EngagementEventResponse",
    "KnowledgeBandCreate",
    "KnowledgeBandUpdate",
    "KnowledgeBandResponse",
    "AIRecommendationCreate",
    "AIRecommendationResponse",
    "FocusSessionCreate",
    "FocusSessionUpdate",
    "FocusSessionResponse",
]
