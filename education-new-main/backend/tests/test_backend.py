import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# Use in-memory SQLite database for tests
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

@pytest.fixture
def auth_headers(client):
    # Register and login a test user
    client.post(
        "/api/auth/register",
        json={
            "email": "adhd_student@example.com",
            "password": "strongpassword123",
            "full_name": "Alex River",
            "focus_span_minutes": 20
        }
    )
    login_res = client.post(
        "/api/auth/login",
        json={"email": "adhd_student@example.com", "password": "strongpassword123"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ==================== Auth Tests ====================
def test_register_and_login(client):
    reg_response = client.post(
        "/api/auth/register",
        json={
            "email": "testuser@example.com",
            "password": "secretpassword",
            "full_name": "Test User",
            "focus_span_minutes": 25
        }
    )
    assert reg_response.status_code == 201
    assert "access_token" in reg_response.json()
    assert reg_response.json()["user"]["email"] == "testuser@example.com"

    login_response = client.post(
        "/api/auth/login",
        json={"email": "testuser@example.com", "password": "secretpassword"}
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

def test_update_profile_settings(client, auth_headers):
    # Test PATCH /api/auth/me (Task 3)
    response = client.patch(
        "/api/auth/me",
        headers=auth_headers,
        json={
            "focus_span_minutes": 15,
            "preferred_content_style": "flashcards",
            "difficulty_level": "intermediate",
            "reminders_enabled": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["focus_span_minutes"] == 15
    assert data["preferred_content_style"] == "flashcards"
    assert data["reminders_enabled"] is False

# ==================== Task & Breakdown Tests ====================
def test_task_crud_and_breakdown(client, auth_headers):
    # 1. Create Task with auto_breakdown
    create_res = client.post(
        "/api/tasks",
        headers=auth_headers,
        json={
            "title": "Complete Biology Chapter 4",
            "description": "Cellular respiration notes",
            "estimated_minutes": 30,
            "priority": "high",
            "auto_breakdown": True
        }
    )
    assert create_res.status_code == 201
    task = create_res.json()
    task_id = task["id"]
    assert task["title"] == "Complete Biology Chapter 4"
    assert len(task["subtasks"]) > 0

    # 2. Get Tasks list
    list_res = client.get("/api/tasks", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Update Task Status
    patch_res = client.patch(
        f"/api/tasks/{task_id}",
        headers=auth_headers,
        json={"status": "completed"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "completed"

# ==================== Focus Session Tests (Task 1) ====================
def test_focus_session_lifecycle_and_feedback(client, auth_headers):
    # 1. Start Focus Session
    create_res = client.post(
        "/api/focus-sessions",
        headers=auth_headers,
        json={"target_minutes": 25}
    )
    assert create_res.status_code == 201
    session = create_res.json()
    session_id = session["id"]
    assert session["target_minutes"] == 25
    assert session["is_completed"] is False

    # 2. Update Session (Pause / Distraction logged)
    update_res = client.patch(
        f"/api/focus-sessions/{session_id}",
        headers=auth_headers,
        json={
            "actual_minutes": 25,
            "distractions_logged": 3,
            "distraction_notes": ["Checked social media", "Doorbell rang", "Lost track"],
            "is_completed": True
        }
    )
    assert update_res.status_code == 200
    updated_session = update_res.json()
    assert updated_session["actual_minutes"] == 25
    assert updated_session["distractions_logged"] == 3
    assert updated_session["is_completed"] is True
    assert updated_session["risk_label"] is not None

    # 3. Call Feedback endpoint
    feedback_res = client.get(
        f"/api/ai/focus-session/{session_id}/feedback",
        headers=auth_headers
    )
    assert feedback_res.status_code == 200
    feedback_data = feedback_res.json()
    assert "risk_label" in feedback_data
    assert "actionable_tip" in feedback_data
    assert feedback_data["recommended_break_minutes"] > 0

# ==================== Study Materials & Flashcards Tests (Task 2) ====================
def test_study_materials_and_flashcards(client, auth_headers):
    # 1. Simplify text
    simplify_res = client.post(
        "/api/study-materials/simplify",
        headers=auth_headers,
        json={
            "title": "Neuroplasticity and Learning",
            "original_text": "Neuroplasticity refers to the brain's ability to reorganize itself by forming new neural connections throughout life. This allows neurons in the brain to compensate for injury and disease.",
            "target_style": "bullet_points"
        }
    )
    assert simplify_res.status_code == 201
    mat = simplify_res.json()
    assert mat["title"] == "Neuroplasticity and Learning"
    assert len(mat["flashcards"]) > 0
    card_id = mat["flashcards"][0]["id"]

    # 2. Review flashcard
    review_res = client.patch(
        f"/api/study-materials/flashcards/{card_id}/review",
        headers=auth_headers,
        json={"difficulty": "easy"}
    )
    assert review_res.status_code == 200
    assert review_res.json()["difficulty"] == "easy"
    assert review_res.json()["review_count"] == 1

# ==================== Progress Analytics Tests ====================
def test_progress_summary(client, auth_headers):
    summary_res = client.get("/api/progress/summary?days=7", headers=auth_headers)
    assert summary_res.status_code == 200
    data = summary_res.json()
    assert "total_focus_minutes" in data
    assert "total_tasks_completed" in data
    assert "completion_rate_percent" in data

# ==================== Assessment Flow Tests (Sections A, B, C, D) ====================
def test_assessment_flow(client, auth_headers):
    # 1. Start Assessment (Section A items returned)
    start_res = client.post("/api/assessment/start", headers=auth_headers)
    assert start_res.status_code == 201
    start_data = start_res.json()
    session_id = start_data["session_id"]
    sec_a_items = start_data["items"]
    assert len(sec_a_items) == 23 # 18 Read-Aloud + 5 Listen-and-Repeat
    assert "correct_answer" not in sec_a_items[0]  # Verify correct_answer not leaked

    # 2. Audio Upload for Section A Item
    dummy_audio = b"dummy_webm_audio_content_test_bytes"
    upload_res = client.post(
        f"/api/assessment/{session_id}/upload-audio",
        headers=auth_headers,
        data={"item_id": sec_a_items[0]["id"]},
        files={"file": ("test.webm", dummy_audio, "audio/webm")}
    )
    assert upload_res.status_code == 200
    assert "audio_storage_path" in upload_res.json()

    # 3. Tab Switch Proctoring Event
    tab_res = client.post(
        f"/api/assessment/{session_id}/tab-switch",
        headers=auth_headers,
        json={"warning_message": "Student switched window"}
    )
    assert tab_res.status_code == 200
    assert tab_res.json()["tab_switch_count"] == 1

    # 4. Fetch Section B Items
    sec_b_res = client.get(f"/api/assessment/{session_id}/section/B", headers=auth_headers)
    assert sec_b_res.status_code == 200
    sec_b_items = sec_b_res.json()
    assert len(sec_b_items) == 4 # 4 Speaking Topics

    # 5. Fetch Section C Items & Respond to Grammar MCQs
    sec_c_res = client.get(f"/api/assessment/{session_id}/section/C", headers=auth_headers)
    assert sec_c_res.status_code == 200
    sec_c_items = sec_c_res.json()
    assert len(sec_c_items) == 34 # 34 Grammar MCQs

    # Answer some MCQs
    resp_res = client.post(
        f"/api/assessment/{session_id}/respond",
        headers=auth_headers,
        json={
            "item_id": sec_c_items[0]["id"],
            "mcq_choice": "went",
            "response_time_ms": 1200
        }
    )
    assert resp_res.status_code == 200
    assert resp_res.json()["is_correct"] is True

    # 6. Fetch Section D Items & Respond to Listening MCQs
    sec_d_res = client.get(f"/api/assessment/{session_id}/section/D", headers=auth_headers)
    assert sec_d_res.status_code == 200
    sec_d_items = sec_d_res.json()
    assert len(sec_d_items) == 20 # 4 passages + 16 MCQs

    # 7. Complete Assessment
    complete_res = client.post(
        f"/api/assessment/{session_id}/complete",
        headers=auth_headers
    )
    assert complete_res.status_code == 200
    results = complete_res.json()
    assert "overall_score" in results
    assert "auto_graded_score" in results
    assert "per_section_breakdown" in results
    assert "ai_summary" in results
    assert results["tab_switch_count"] == 1

    # 8. Fetch Results endpoint
    get_results_res = client.get(f"/api/assessment/{session_id}/results", headers=auth_headers)
    assert get_results_res.status_code == 200
    assert get_results_res.json()["session_id"] == session_id

    # 9. Fetch History
    history_res = client.get("/api/assessment/history", headers=auth_headers)
    assert history_res.status_code == 200
    assert len(history_res.json()) >= 1



