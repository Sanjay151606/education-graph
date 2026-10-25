import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Uuid, JSON, Numeric
from sqlalchemy.orm import relationship

from app.db.session import Base


class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = {"extend_existing": True}

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(Uuid(as_uuid=True), ForeignKey("study_materials.id", ondelete="SET NULL"), nullable=True, index=True)
    teacher_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Interactive Activity")
    type = Column(String(50), nullable=False)  # matching, fill_blank, flashcards, mini_challenge
    knowledge_band = Column(String(50), nullable=False, default="all", index=True)  # foundation, on_track, advanced, all
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    material = relationship("StudyMaterial", back_populates="activities")
    teacher = relationship("User", back_populates="created_activities", foreign_keys=[teacher_id])
    attempts = relationship("ActivityAttempt", back_populates="activity", cascade="all, delete-orphan")


class ActivityAttempt(Base):
    __tablename__ = "activity_attempts"
    __table_args__ = {"extend_existing": True}

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    activity_id = Column(Uuid(as_uuid=True), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Numeric(precision=5, scale=2), nullable=True)
    responses = Column(JSON, nullable=True)
    completed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    activity = relationship("Activity", back_populates="attempts")
    user = relationship("User", back_populates="activity_attempts")
