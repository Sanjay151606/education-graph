import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Uuid
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, default="")
    full_name = Column(String(255), nullable=True, default="")
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False, default="")
    role = Column(String(50), nullable=True, default="student")
    status = Column(String(50), nullable=True, default="active")
    phone_number = Column(String(50), nullable=True)
    parent_email = Column(String(255), nullable=True)
    parent_phone_number = Column(String(50), nullable=True)
    from sqlalchemy import Boolean
    notify_on_completion = Column(Boolean, default=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    study_materials = relationship("StudyMaterial", back_populates="user", cascade="all, delete-orphan")
    focus_sessions = relationship("FocusSession", back_populates="user", cascade="all, delete-orphan")
    progress_records = relationship("Progress", back_populates="user", cascade="all, delete-orphan")
    ai_recommendations = relationship("AIRecommendation", back_populates="user", cascade="all, delete-orphan")
    adhd_profile = relationship("ADHDProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    engagement_events = relationship("EngagementEvent", back_populates="user", cascade="all, delete-orphan")
    knowledge_bands = relationship("KnowledgeBand", back_populates="user", cascade="all, delete-orphan")
    assessment_sessions = relationship("AssessmentSession", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    activities_logged = relationship("StudentActivity", back_populates="user", cascade="all, delete-orphan")
    created_activities = relationship("Activity", back_populates="teacher", cascade="all, delete-orphan", foreign_keys="[Activity.teacher_id]")
    activity_attempts = relationship("ActivityAttempt", back_populates="user", cascade="all, delete-orphan")
