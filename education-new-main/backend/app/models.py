import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False, default="")
    full_name = Column(String, nullable=False)
    role = Column(String, default="student", nullable=False)   # student / teacher
    status = Column(String, default="active", nullable=False)  # active / pending / suspended

    # ADHD learning profile
    focus_span_minutes = Column(Integer, default=20)          # baseline sustained attention
    preferred_content_style = Column(String, default="visual") # visual / audio / text / mixed
    difficulty_level = Column(String, default="adaptive")      # easy / medium / hard / adaptive
    reminders_enabled = Column(Boolean, default=True)

    # Notification & Parent Contacts
    phone_number = Column(String, nullable=True)
    parent_email = Column(String, nullable=True)
    parent_phone_number = Column(String, nullable=True)
    notify_on_completion = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    materials = relationship("StudyMaterial", back_populates="owner", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="owner", cascade="all, delete-orphan")
    focus_sessions = relationship("FocusSession", back_populates="owner", cascade="all, delete-orphan")
    assessment_sessions = relationship("AssessmentSession", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = {"extend_existing": True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    task_id = Column(UUID(as_uuid=True), nullable=True)
    session_id = Column(UUID(as_uuid=True), nullable=True)
    summary = Column(Text, nullable=False)
    score = Column(Numeric(precision=5, scale=2), nullable=True)
    sent_via = Column(String, default="both", nullable=False)
    sent_status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reports")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    subtasks = Column(JSON, default=list)       # AI-broken-down microtasks
    priority = Column(String, default="medium") # low / medium / high
    status = Column(String, default="pending")  # pending / in_progress / done
    estimated_minutes = Column(Integer, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="tasks")


class StudyMaterial(Base):
    __tablename__ = "study_materials"
    __table_args__ = {"extend_existing": True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    subject = Column(String, default="General", nullable=False)
    topic = Column(String, default="", nullable=False)
    description = Column(Text, nullable=True)
    material_type = Column(String, default="Notes", nullable=False)
    structured_content = Column(JSON, default=dict, nullable=False)
    original_content = Column(Text, nullable=True)
    simplified_content = Column(Text, nullable=True)
    original_text = Column(Text, nullable=True)     # backward-compatible alias
    simplified_text = Column(Text, nullable=True)   # backward-compatible alias
    summary_bullets = Column(JSON, default=list)    # AI-generated key points
    flashcards = Column(JSON, default=list)         # AI-generated Q/A pairs
    file_name = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    tags = Column(JSON, default=list, nullable=False)
    source_file_name = Column(String, nullable=True)
    knowledge_band_target = Column(String, default="all", nullable=False)
    visibility = Column(String, default="published", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="materials")



class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    subject = Column(String, nullable=True)
    activity_type = Column(String, nullable=True)  # quiz / task / study_session
    score = Column(Float, nullable=True)
    time_spent_minutes = Column(Integer, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="progress_logs")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    technique = Column(String, default="pomodoro")  # pomodoro / timeboxing / body_doubling
    planned_minutes = Column(Integer, default=25)
    actual_minutes = Column(Integer, nullable=True)
    distractions_logged = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="focus_sessions")


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("assessment_sessions.id"), nullable=False)
    item_id = Column(String, ForeignKey("assessment_items.id"), nullable=False)
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

