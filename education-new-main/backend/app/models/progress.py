import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import relationship

from app.db.session import Base


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(255), nullable=False, index=True)
    score = Column(Numeric(5, 2), nullable=False)
    date = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="progress_records")
