import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Uuid, JSON, Index
from sqlalchemy.orm import relationship

from app.db.session import Base


class StudentActivity(Base):
    __tablename__ = "student_activity"
    __table_args__ = (
        Index("ix_student_activity_user_id_created_at", "user_id", "created_at"),
        {"extend_existing": True},
    )

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String(100), nullable=False, index=True)
    reference_id = Column(Uuid(as_uuid=True), nullable=True)
    metadata_json = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="activities_logged")
