import pytest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.models.user import User
from app.models.task import Task
from app.models.report import Report
from app.models.knowledge_band import KnowledgeBand, BandLevel
from app.services import notification_service, ai_service

# In-memory SQLite engine for rapid isolated testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_report_generation_and_notification(db_session):
    # 1. Create a user with phone and parent contacts
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="student@braingraph.edu",
        full_name="Alex River",
        phone_number="+15550001111",
        parent_email="parent@braingraph.edu",
        parent_phone_number="+15552223333",
        notify_on_completion=True,
    )
    db_session.add(user)

    task_id = uuid.uuid4()
    task = Task(
        id=task_id,
        user_id=user_id,
        title="Cellular Respiration Micro-Module",
        status="done",
    )
    db_session.add(task)
    db_session.commit()

    # 2. Generate report
    report = notification_service.generate_report(
        user_id=user_id,
        task_id=task_id,
        score=92.5,
        db=db_session,
    )

    assert report is not None
    assert report.user_id == user_id
    assert report.task_id == task_id
    assert report.score == 92.5
    assert "Alex River" in report.summary
    assert report.sent_status in ("sent", "sent_simulated")

    # 3. Test duplicate prevention
    dup_report = notification_service.generate_report(
        user_id=user_id,
        task_id=task_id,
        score=92.5,
        db=db_session,
    )
    assert dup_report.id == report.id


def test_practice_quiz_generation(db_session):
    quiz = ai_service.generate_practice_quiz(
        topic="Cellular Respiration",
        band="foundation",
        db=db_session,
    )
    assert quiz is not None
    assert quiz.get("band") == "foundation"
    questions = quiz.get("questions", [])
    assert len(questions) == 5
    first_q = questions[0]
    assert "question" in first_q
    assert len(first_q.get("options", [])) == 4
    assert "correct_answer" in first_q
    assert "explanation" in first_q
    assert "hint" in first_q


def test_doubt_solving_assistant(db_session):
    resp = ai_service.solve_doubt(
        material_id=None,
        question="What is ATP synthesis?",
        db=db_session,
    )
    assert resp is not None
    assert "answer" in resp
    assert "key_takeaway" in resp
    assert "suggested_followup" in resp


def test_weekly_progress_digest(db_session):
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="digest_student@braingraph.edu",
        full_name="Jordan Lee",
        notify_on_completion=True,
    )
    db_session.add(user)
    db_session.commit()

    digest = ai_service.generate_weekly_progress_digest(
        user_id=user_id,
        db=db_session,
    )
    assert digest is not None
    assert digest.get("student_name") == "Jordan Lee"
    assert "summary" in digest
    assert len(digest.get("celebrations", [])) >= 1


def test_strengths_and_weaknesses_mapper(db_session):
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="mapper_student@braingraph.edu",
        full_name="Sam Taylor",
    )
    db_session.add(user)

    band1 = KnowledgeBand(
        user_id=user_id,
        topic_id="respiration",
        band=BandLevel.ADVANCED,
    )
    band2 = KnowledgeBand(
        user_id=user_id,
        topic_id="enzymes",
        band=BandLevel.FOUNDATION,
    )
    db_session.add_all([band1, band2])
    db_session.commit()

    res = ai_service.map_strengths_and_weaknesses(user_id=user_id, db=db_session)
    assert res is not None
    assert len(res.get("strengths", [])) >= 1
    assert len(res.get("growth_areas", [])) >= 1


def test_teacher_class_insights(db_session):
    insights = ai_service.generate_teacher_class_insights(
        topic="Cellular Respiration",
        db=db_session,
    )
    assert insights is not None
    assert "total_students" in insights
    assert "band_distribution" in insights
    assert "executive_summary" in insights
    assert len(insights.get("recommended_lesson_plan", [])) >= 1
