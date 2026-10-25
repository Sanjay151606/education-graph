import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import relationship

from app.db.session import Base


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = {"extend_existing": True}

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Uuid(as_uuid=True), nullable=True, index=True)
    session_id = Column(Uuid(as_uuid=True), nullable=True, index=True)
    summary = Column(Text, nullable=False)
    score = Column(Numeric(precision=5, scale=2), nullable=True)
    sent_via = Column(String(50), default="both", nullable=False)  # sms / email / both
    sent_status = Column(String(50), default="pending", nullable=False)  # pending / sent / failed
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="reports")
