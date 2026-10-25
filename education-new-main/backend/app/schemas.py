import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr


# ---------- Auth ----------
class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: str = "student"
    status: str = "active"
    focus_span_minutes: int
    preferred_content_style: str
    difficulty_level: str
    reminders_enabled: bool = True

    class Config:
        from_attributes = True

class UserUpdateProfile(BaseModel):
    full_name: Optional[str] = None
    focus_span_minutes: Optional[int] = None
    preferred_content_style: Optional[str] = None
    difficulty_level: Optional[str] = None
    reminders_enabled: Optional[bool] = None


# ---------- Tasks ----------
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[datetime] = None
    auto_breakdown: bool = True   # let AI split into subtasks

class TaskOut(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    subtasks: List[Any]
    priority: str
    status: str
    estimated_minutes: Optional[int]
    due_date: Optional[datetime]

    class Config:
        from_attributes = True


# ---------- Study Materials ----------
class MaterialCreate(BaseModel):
    title: str
    original_text: str
    subject: Optional[str] = None

class MaterialOut(BaseModel):
    id: uuid.UUID
    title: str
    simplified_text: Optional[str]
    summary_bullets: List[Any]
    flashcards: List[Any]
    subject: Optional[str]

    class Config:
        from_attributes = True


# ---------- Progress ----------
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


# ---------- AI ----------
class RecommendationRequest(BaseModel):
    subject: Optional[str] = None

class RecommendationOut(BaseModel):
    recommendations: List[str]
    suggested_focus_minutes: int
    suggested_break_minutes: int
    motivational_note: str


# ---------- Assessment ----------
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

