import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.knowledge_band import KnowledgeBand, BandLevel
from app.models.study_material import StudyMaterial
from app.services.ai_service import ai_service
from app.auth import get_current_user, require_teacher, require_student

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


TEACHER_ID = uuid.uuid4()
STUDENT_ID = uuid.uuid4()


def override_teacher():
    return User(
        id=TEACHER_ID,
        email="teacher@braingraph.edu",
        name="Prof. Davis",
        full_name="Prof. Davis",
        role="teacher",
        status="active",
    )


def override_student():
    return User(
        id=STUDENT_ID,
        email="student@braingraph.edu",
        name="Alex Rivera",
        full_name="Alex Rivera",
        role="student",
        status="active",
    )


@pytest.fixture
def teacher_auth():
    app.dependency_overrides[get_current_user] = override_teacher
    app.dependency_overrides[require_teacher] = override_teacher
    return {"Authorization": "Bearer test-teacher-token", "teacher_id": str(TEACHER_ID)}


@pytest.fixture
def student_auth():
    app.dependency_overrides[get_current_user] = override_student
    app.dependency_overrides[require_student] = override_student
    return {"Authorization": "Bearer test-student-token", "student_id": str(STUDENT_ID)}


def test_ai_service_generate_student_ready_format():
    sample_text = (
        "Cellular respiration is the process through which cells convert glucose into ATP.\n\n"
        "Glycolysis takes place in the cytoplasm and breaks glucose into two pyruvate molecules.\n\n"
        "The Krebs Cycle occurs inside the mitochondrial matrix and produces electron carriers.\n\n"
        "Oxidative Phosphorylation uses an electron transport chain across the inner membrane to create the bulk of ATP."
    )
    res = ai_service.generate_student_ready_format(material_id=None, db=None, original_content=sample_text)
    assert "summary" in res
    assert "sections" in res
    assert "key_takeaways" in res
    assert len(res["sections"]) >= 1
    assert "formatted_text" in res


def test_teacher_create_study_material_json(client, teacher_auth):
    headers = {"Authorization": teacher_auth["Authorization"]}
    payload = {
        "title": "Introduction to Photosynthesis",
        "subject": "Biology",
        "topic": "Photosynthesis",
        "description": "Scaffolded notes on light-dependent and Calvin cycle reactions.",
        "target_band": "foundation",
        "original_content": "Photosynthesis takes place in chloroplasts. Light reactions produce ATP and NADPH. Calvin cycle fixes CO2 into sugar.",
        "tags": ["biology", "chloroplast", "plants"],
        "visibility": "published",
    }
    response = client.post("/study/materials", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Introduction to Photosynthesis"
    assert data["subject"] == "Biology"
    assert data["knowledge_band_target"] == "foundation"
    assert data["simplified_content"] is not None
    material_id = data["id"]

    # Teacher list endpoint
    list_res = client.get(f"/study/materials/teacher/{teacher_auth['teacher_id']}", headers=headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert len(list_data) >= 1
    assert list_data[0]["id"] == material_id


def test_teacher_edit_and_delete_study_material(client, teacher_auth):
    headers = {"Authorization": teacher_auth["Authorization"]}
    # Create material
    create_res = client.post(
        "/study/materials",
        json={
            "title": "Quantum Mechanics Basics",
            "subject": "Physics",
            "topic": "Quantum",
            "target_band": "advanced",
            "original_content": "Wave particle duality is a fundamental concept of quantum mechanics.",
        },
        headers=headers,
    )
    assert create_res.status_code == 200
    mat_id = create_res.json()["id"]

    # Update material
    update_res = client.put(
        f"/study/materials/{mat_id}",
        json={"title": "Updated Quantum Mechanics", "visibility": "draft"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Quantum Mechanics"
    assert update_res.json()["visibility"] == "draft"

    # Delete material
    del_res = client.delete(f"/study/materials/{mat_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"


def test_student_get_banded_study_materials(client, teacher_auth, student_auth):
    t_headers = {"Authorization": teacher_auth["Authorization"]}
    s_headers = {"Authorization": student_auth["Authorization"]}

    # Create band assignment for student
    db = TestingSessionLocal()
    band = KnowledgeBand(
        user_id=STUDENT_ID,
        topic_id="biology",
        band=BandLevel.FOUNDATION,
    )
    db.add(band)
    db.commit()
    db.close()

    # Teacher creates 2 materials: one foundation (matches student), one advanced
    client.post(
        "/study/materials",
        json={
            "title": "Foundation Biology Basics",
            "subject": "Biology",
            "topic": "biology",
            "target_band": "foundation",
            "original_content": "Basic cell structure notes.",
            "visibility": "published",
        },
        headers=t_headers,
    )

    client.post(
        "/study/materials",
        json={
            "title": "Advanced Molecular Biology",
            "subject": "Biology",
            "topic": "biology",
            "target_band": "advanced",
            "original_content": "Advanced genetic transcription and post-translational modifications.",
            "visibility": "published",
        },
        headers=t_headers,
    )

    # Student retrieves materials for their band
    res = client.get(f"/study/materials/student/{student_auth['student_id']}", headers=s_headers)
    assert res.status_code == 200
    items = res.json()
    titles = [item["title"] for item in items]
    assert "Foundation Biology Basics" in titles
    assert "Advanced Molecular Biology" not in titles
