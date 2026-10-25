import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SAEnum, ForeignKey, Uuid
from sqlalchemy.orm import relationship

from app.db.session import Base


class BandLevel(str, enum.Enum):
    FOUNDATION = "foundation"
    ON_TRACK = "on_track"
    ADVANCED = "advanced"


class KnowledgeBand(Base):
    __tablename__ = "knowledge_bands"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(255), nullable=False, index=True)
    band = Column(
        SAEnum(BandLevel, name="band_level", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        index=True,
    )
    assigned_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="knowledge_bands")
