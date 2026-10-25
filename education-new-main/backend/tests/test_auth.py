import os
import sys
import pytest
from jose import jwt
from fastapi.testclient import TestClient
# Ensure the app package can be imported
sys.path.append(os.path.abspath(os.path.join(__file__, '..', '..')))
from app.main import app  # Import FastAPI instance

# Load the Supabase JWT secret from environment (fallback to a test secret)
TEST_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "test-secret")

def create_jwt(sub: str, email: str = "test@example.com", full_name: str = "Test User"):
    payload = {
        "sub": sub,
        "email": email,
        "user_metadata": {"full_name": full_name},
        "aud": "authenticated",
    }
    token = jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")
    return token

client = TestClient(app)

def test_me_endpoint_valid_token():
    import uuid
    user_id = str(uuid.uuid4())
    token = create_jwt(user_id)
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"

def test_me_endpoint_missing_token():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_me_endpoint_invalid_token():
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalidtoken"},
    )
    assert response.status_code == 401
