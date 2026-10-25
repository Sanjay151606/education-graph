import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Enum as SAEnum, ForeignKey, Uuid
from sqlalchemy.orm import relationship

from app.db.session import Base


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(
        SAEnum(TaskPriority, name="task_priority", values_callable=lambda obj: [e.value for e in obj]),
        default=TaskPriority.MEDIUM,
        nullable=False,
    )
    due_date = Column(DateTime(timezone=True), nullable=True, index=True)
    status = Column(
        SAEnum(TaskStatus, name="task_status", values_callable=lambda obj: [e.value for e in obj]),
        default=TaskStatus.PENDING,
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="tasks")
