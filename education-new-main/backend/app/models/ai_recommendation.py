import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import relationship

from app.db.session import Base


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(100), nullable=False, index=True)
    subtype = Column(String(100), nullable=True)
    content = Column(JSON, nullable=False)  # JSON / Text recommendation content
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="ai_recommendations")
