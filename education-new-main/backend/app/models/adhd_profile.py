from datetime import datetime
from sqlalchemy import Column, Integer, Numeric, Boolean, Text, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import relationship

from app.db.session import Base


class ADHDProfile(Base):
    __tablename__ = "adhd_profile"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    focus_span_avg_minutes = Column(Numeric(5, 2), nullable=True)
    preferred_break_interval = Column(Integer, nullable=True)  # in minutes
    reduced_stimulation_enabled = Column(Boolean, default=False, nullable=False)
    chunking_preference = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="adhd_profile")
