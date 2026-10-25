import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, Numeric, DateTime, Enum as SAEnum, ForeignKey, Uuid, CheckConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


class EngagementState(str, enum.Enum):
    FOCUSED = "focused"
    MILD_CONFUSION = "mild_confusion"
    LOST = "lost"
    DISENGAGED = "disengaged"


class EngagementEvent(Base):
    __tablename__ = "engagement_events"

    __table_args__ = (
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_engagement_events_confidence_range"),
    )

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(Uuid(as_uuid=True), ForeignKey("focus_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    state = Column(
        SAEnum(EngagementState, name="engagement_state", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        index=True,
    )
    confidence = Column(Numeric(4, 3), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="engagement_events")
    session = relationship("FocusSession", back_populates="engagement_events")
