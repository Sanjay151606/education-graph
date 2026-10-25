from app.db.session import Base, engine, SessionLocal, get_db



def get_db():
    """FastAPI dependency: yields a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
