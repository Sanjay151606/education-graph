import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_exception

    token = credentials.credentials
    jwt_secret = settings.effective_jwt_secret

    # Support development & demo testing tokens
    if token.startswith("demo-"):
        is_teacher_demo = "teacher" in token
        user_uuid = (
            uuid.UUID("t0000000-0000-0000-0000-000000000001")
            if is_teacher_demo
            else uuid.UUID("a0000000-0000-0000-0000-000000000001")
        )
        payload = {
            "sub": str(user_uuid),
            "email": "teacher@braingraph.edu" if is_teacher_demo else "alex.learner@braingraph.edu",
            "user_metadata": {
                "full_name": "Prof. Davis" if is_teacher_demo else "Alex Rivera (Demo)",
                "role": "teacher" if is_teacher_demo else "student",
            },
        }
    else:
        try:
            # Guard against missing or placeholder Supabase JWT secret
            if not jwt_secret or jwt_secret == "REPLACE_WITH_YOUR_SUPABASE_JWT_SECRET":
                # Only enforce in production environment
                if getattr(settings, "environment", "development") != "development":
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Supabase JWT secret not configured. Set SUPABASE_JWT_SECRET in .env.",
                    )
            # If a secret is provided, verify signature.
            if jwt_secret:
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=[settings.jwt_algorithm],
                    options={"verify_aud": False},
                )
            else:
                # Fallback for unconfigured dev environment (claims parsing without signature check)
                payload = jwt.get_unverified_claims(token)

            user_id_str: Optional[str] = payload.get("sub")
            if not user_id_str:
                raise credentials_exception
            user_uuid = uuid.UUID(user_id_str)
        except (JWTError, ValueError):
            raise credentials_exception

    # Find or upsert user row keyed by Supabase Auth user UUID
    user = db.query(models.User).filter(models.User.id == user_uuid).first()
    if user is None:
        email = payload.get("email") or f"{user_id_str}@auth.supabase.local"
        user_metadata = payload.get("user_metadata") or payload.get("raw_user_meta_data") or {}
        full_name = (
            user_metadata.get("full_name")
            or user_metadata.get("name")
            or (email.split("@")[0] if email else "Learner")
        )
        requested_role = user_metadata.get("role") or "student"
        user_role = "teacher" if requested_role == "teacher" else "student"
        
        # Teacher accounts require approval unless demo; student accounts are active immediately
        user_status = "active"
        if user_role == "teacher" and not token.startswith("demo-"):
            user_status = "pending"

        user = models.User(
            id=user_uuid,
            name=full_name,
            full_name=full_name,
            email=email,
            role=user_role,
            status=user_status,
            hashed_password="auth_session_managed",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def require_student(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Verifies that the authenticated user has the 'student' role."""
    role = getattr(current_user, "role", None) or "student"
    if role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Student account required.",
        )
    return current_user


def require_teacher(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Verifies that the authenticated user has the 'teacher' role and active approval status."""
    role = getattr(current_user, "role", None) or "student"
    if role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Teacher privileges required.",
        )
    user_status = getattr(current_user, "status", None) or "active"
    if user_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher account is pending administrator approval.",
        )
    return current_user

