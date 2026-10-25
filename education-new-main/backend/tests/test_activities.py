import pytest
import uuid
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.models.user import User
from app.models.student_activity import StudentActivity
from app.models.activity import Activity, ActivityAttempt
from app.models.knowledge_band import KnowledgeBand, BandLevel
from app.services import activity_service, ai_service

# In-memory SQLite engine for isolated tests
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


def test_log_activity_and_timeline(db_session):
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="timeline_student@braingraph.edu",
        full_name="Taylor Swift",
    )
    db_session.add(user)
    db_session.commit()

    # Log two distinct activities
    act1 = activity_service.log_activity(
        user_id=user_id,
        activity_type="task_completed",
        metadata={"title": "Biology Chapter 1 Micro-task"},
        db=db_session,
    )
    assert act1 is not None
    assert act1.activity_type == "task_completed"

    act2 = activity_service.log_activity(
        user_id=user_id,
        activity_type="material_viewed",
        metadata={"title": "Cellular Respiration Notes"},
        db=db_session,
    )
    assert act2 is not None

    # Retrieve timeline
    timeline = activity_service.get_activity_timeline(
        user_id=user_id,
        range_filter="week",
        db=db_session,
    )
    assert timeline["total_activities"] == 2
    assert len(timeline["groups"]["today"]) == 2


def test_streak_calculation(db_session):
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="streak_student@braingraph.edu",
        full_name="Morgan Riley",
    )
    db_session.add(user)
    db_session.commit()

    # Log activity for today and yesterday
    today_act = StudentActivity(
        id=uuid.uuid4(),
        user_id=user_id,
        activity_type="task_completed",
        created_at=datetime.utcnow(),
    )
    yesterday_act = StudentActivity(
        id=uuid.uuid4(),
        user_id=user_id,
        activity_type="quiz_attempted",
        created_at=datetime.utcnow() - timedelta(days=1),
    )
    db_session.add_all([today_act, yesterday_act])
    db_session.commit()

    streak_info = activity_service.get_streak(user_id=user_id, db=db_session)
    assert streak_info["current_streak_days"] >= 2
    assert streak_info["active_today"] is True


def test_activity_creation_and_attempt(db_session):
    teacher_id = uuid.uuid4()
    student_id = uuid.uuid4()

    teacher = User(id=teacher_id, email="teacher@braingraph.edu", full_name="Dr. Smith", role="teacher")
    student = User(id=student_id, email="student@braingraph.edu", full_name="Alex River", role="student")
    db_session.add_all([teacher, student])
    db_session.commit()

    # Create matching activity
    activity_id = uuid.uuid4()
    act = Activity(
        id=activity_id,
        teacher_id=teacher_id,
        title="ATP Synthase Matching",
        type="matching",
        knowledge_band="on_track",
        content={
            "pairs": [
                {"id": "1", "term": "ATP", "definition": "Energy currency"},
                {"id": "2", "term": "NADH", "definition": "Electron carrier"},
            ]
        },
        created_at=datetime.utcnow(),
    )
    db_session.add(act)
    db_session.commit()

    # Submit an attempt
    attempt_id = uuid.uuid4()
    attempt = ActivityAttempt(
        id=attempt_id,
        activity_id=activity_id,
        user_id=student_id,
        score=100.0,
        responses={"matches": {"1": "1", "2": "2"}},
        completed_at=datetime.utcnow(),
    )
    db_session.add(attempt)
    db_session.commit()

    # Log in activity timeline
    activity_service.log_activity(
        user_id=student_id,
        activity_type="quiz_attempted",
        reference_id=activity_id,
        metadata={"score": 100.0, "title": act.title},
        db=db_session,
    )

    timeline = activity_service.get_activity_timeline(user_id=student_id, db=db_session)
    assert timeline["total_activities"] >= 1
    assert timeline["groups"]["today"][0]["metadata"]["score"] == 100.0


def test_flashcard_generator(db_session):
    cards = ai_service.generate_flashcards_from_material(material_id=None, db=db_session)
    assert cards is not None
    assert len(cards) >= 1
    first_card = cards[0]
    assert "front" in first_card
    assert "back" in first_card
    assert "hint" in first_card
