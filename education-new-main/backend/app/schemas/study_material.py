import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


class StructuredContent(BaseModel):
    learning_objectives: Optional[List[str]] = []
    key_concepts: Optional[List[str]] = []
    detailed_notes: Optional[str] = ""
    important_points: Optional[List[str]] = []
    quick_revision: Optional[str] = ""
    practice_questions: Optional[List[str]] = []


class StudyMaterialBase(BaseModel):
    title: str
    subject: str = "General"
    topic: Optional[str] = ""
    description: Optional[str] = None
    material_type: str = "Notes"  # Notes | PDF | Document | Presentation | Video | Link | Question Set | Study Guide
    structured_content: Optional[Dict[str, Any]] = {}
    original_content: Optional[str] = None
    simplified_content: Optional[str] = None
    original_text: Optional[str] = None
    tags: List[str] = []
    visibility: str = "published"  # "published" | "draft"
    allow_download: bool = True


class StudyMaterialCreate(StudyMaterialBase):
    pass


class StudyMaterialUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    description: Optional[str] = None
    material_type: Optional[str] = None
    structured_content: Optional[Dict[str, Any]] = None
    original_content: Optional[str] = None
    simplified_content: Optional[str] = None
    tags: Optional[List[str]] = None
    visibility: Optional[str] = None
    allow_download: Optional[bool] = None


class StudyMaterialOut(StudyMaterialBase):
    id: uuid.UUID
    user_id: uuid.UUID
    author_name: Optional[str] = "Instructor"
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    has_file: bool = False
    download_url: Optional[str] = None
    allow_download: bool = True
    is_read: Optional[bool] = False
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MaterialSignedUrlOut(BaseModel):
    id: uuid.UUID
    file_name: str
    signed_url: str
    expires_in_seconds: int = 300


class NoteReadStatusOut(BaseModel):
    material_id: uuid.UUID
    is_read: bool
    read_at: Optional[datetime] = None

