import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Uuid, JSON, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


class StudyMaterial(Base):
    __tablename__ = "study_materials"
    __table_args__ = {"extend_existing": True}

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(100), default="General", nullable=False, index=True)
    topic = Column(String(150), default="", nullable=False, index=True)
    description = Column(Text, nullable=True)
    material_type = Column(String(50), default="Notes", nullable=False, index=True)  # Notes, PDF, Document, Presentation, Video, Link, Question Set, Study Guide
    structured_content = Column(JSON, default=dict, nullable=False)  # { learning_objectives, key_concepts, detailed_notes, important_points, quick_revision, practice_questions }
    original_content = Column(Text, nullable=True)
    simplified_content = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)  # Supabase Storage path: study-materials/{teacher_user_id}/{material_id}/{file_name}
    file_type = Column(String(100), nullable=True)  # MIME type e.g. application/pdf
    file_size = Column(Integer, nullable=True)      # Size in bytes
    tags = Column(JSON, default=list, nullable=False)  # List of tag strings: ["biology", "ATP"]
    source_file_name = Column(String(255), nullable=True)
    knowledge_band_target = Column(String(50), default="all", nullable=False, index=True)  # foundation / on_track / advanced / all
    visibility = Column(String(20), default="published", nullable=False, index=True)  # "published" | "draft"
    allow_download = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="study_materials")
    activities = relationship("Activity", back_populates="material")
    read_progress = relationship("NoteReadProgress", back_populates="material", cascade="all, delete-orphan")


class NoteReadProgress(Base):
    """Tracks per-student read status for each study material / note."""
    __tablename__ = "note_read_progress"
    __table_args__ = (
        UniqueConstraint("material_id", "user_id", name="uq_note_read_material_user"),
        {"extend_existing": True},
    )

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(Uuid(as_uuid=True), ForeignKey("study_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)

    material = relationship("StudyMaterial", back_populates="read_progress")

