import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import relationship

from app.db.session import Base


class SessionRecording(Base):
    __tablename__ = "session_recordings"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String, nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_path = Column(Text, nullable=False)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    chunk_count = Column(Integer, default=0, nullable=False)
    status = Column(String, default="recording", nullable=False) # "recording" | "completed" | "failed"
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="session_recordings")
