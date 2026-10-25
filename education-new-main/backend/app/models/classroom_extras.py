import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Uuid
from app.db.session import Base

class ConfusionBookmark(Base):
    __tablename__ = "confusion_bookmarks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)
    topic_or_slide = Column(String, default="General Lecture")
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class DiagnosticQuizItem(Base):
    __tablename__ = "diagnostic_quiz_items"

    id = Column(String, primary_key=True)
    topic_id = Column(String, nullable=False, index=True)
    topic_name = Column(String, nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(Text, nullable=False) # JSON encoded string
    correct_answer = Column(String, nullable=False)
    difficulty = Column(String, default="medium")
    explanation = Column(Text, nullable=True)
