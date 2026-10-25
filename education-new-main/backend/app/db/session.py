from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Supavisor transaction pooler on Supabase handles server-side connection pooling.
# NullPool disables client-side pooling so connections are not held open unnecessarily.
engine_kwargs = {
    "poolclass": NullPool,
}

if settings.database_url.startswith("postgresql"):
    # Ensure SSL mode is enabled for remote Supabase connections if not specified in URL
    if "sslmode" not in settings.database_url:
        engine_kwargs["connect_args"] = {"sslmode": "require"}
elif settings.database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """
    FastAPI dependency that provides a SQLAlchemy database session per request,
    ensuring proper cleanup when the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
