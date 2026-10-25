import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import relationship

from app.db.session import Base


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # duration in seconds
    interruptions = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="focus_sessions")
    engagement_events = relationship("EngagementEvent", back_populates="session", cascade="all, delete-orphan")
