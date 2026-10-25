import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Float, JSON, Uuid
from sqlalchemy.orm import relationship

from app.db.session import Base


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    candidate_name = Column(String, nullable=True)
    status = Column(String, default="in_progress")  # in_progress / completed
    current_section = Column(String, default="A")   # A / B / C / D
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    tab_switch_count = Column(Integer, default=0)
    warnings = Column(JSON, default=list)
    overall_score = Column(Float, nullable=True)
    ai_summary = Column(Text, nullable=True)
    per_type_breakdown = Column(JSON, default=dict)

    user = relationship("User", back_populates="assessment_sessions")
    responses = relationship("AssessmentResponse", back_populates="session", cascade="all, delete-orphan")


class AssessmentItem(Base):
    __tablename__ = "assessment_items"

    id = Column(String, primary_key=True)  # e.g., "sec-a-ra-1", "sec-b-topic-1"
    section = Column(String, nullable=False)  # A / B / C / D
    item_type = Column(String, nullable=False)  # read_aloud / listen_repeat / speaking_prep / speaking_task / grammar_mcq / listening_comprehension
    sequence_index = Column(Integer, nullable=False)
    prompt_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)  # List[str] for MCQ
    correct_answer = Column(String, nullable=True)  # Never sent to frontend before grading
    hints = Column(JSON, nullable=True)  # List[str] for Section B topics
    time_limit_seconds = Column(Integer, nullable=True)
    passage_group_id = Column(String, nullable=True)  # Groups Section D questions under passage
    difficulty = Column(String, nullable=True)

    responses = relationship("AssessmentResponse", back_populates="item")


class AssessmentResponse(Base):
    __tablename__ = "assessment_responses"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(Uuid(as_uuid=True), ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String, ForeignKey("assessment_items.id", ondelete="CASCADE"), nullable=False)
    response_type = Column(String, nullable=False)  # audio / mcq_choice
    audio_storage_path = Column(String, nullable=True)  # e.g. "{user_id}/{session_id}/{item_id}.webm"
    mcq_choice = Column(String, nullable=True)
    user_answer_text = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)  # Evaluated server-side for MCQs
    similarity_score = Column(Float, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("AssessmentSession", back_populates="responses")
    item = relationship("AssessmentItem", back_populates="responses")
