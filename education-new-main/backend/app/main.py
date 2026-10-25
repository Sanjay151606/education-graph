import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine

# Import all models so SQLAlchemy metadata is complete before create_all
from app import models  # noqa: F401
from app import models_v2  # noqa: F401

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup (no-op if they already exist). Swallows connection
    errors so the API starts even when the database is temporarily unreachable."""
    try:
        Base.metadata.create_all(bind=engine)
        # Automatic migration check for SQLite
        try:
            from sqlalchemy import text
            with engine.connect() as conn:
                res = conn.execute(text("PRAGMA table_info(study_materials)"))
                existing_cols = [row[1] for row in res.fetchall()]
                if existing_cols and "allow_download" not in existing_cols:
                    conn.execute(text("ALTER TABLE study_materials ADD COLUMN allow_download BOOLEAN DEFAULT 1"))
                    conn.commit()
        except Exception:
            pass
        logger.info("Database tables verified / created.")
    except Exception as exc:
        logger.warning(
            "Could not run create_all at startup (DB may be unreachable): %s", exc
        )
    yield
    # Nothing to teardown


app = FastAPI(title="BrainGraph API", version="1.0.0", lifespan=lifespan)

# ─── CORS ────────────────────────────────────────────────────────────────────
# Read allowed origin from FRONTEND_URL environment variable, or fall back to CORS_ORIGINS
_origins = []
if settings.frontend_url:
    for url in settings.frontend_url.split(","):
        cleaned = url.strip().rstrip("/")
        if cleaned and cleaned not in _origins:
            _origins.append(cleaned)

if settings.cors_origins:
    for o in settings.cors_origins.split(","):
        cleaned = o.strip().rstrip("/")
        if cleaned and cleaned not in _origins:
            _origins.append(cleaned)

if not _origins:
    _origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Core Routers ─────────────────────────────────────────────────────────────
from app.routers import auth, tasks, study_materials, progress, ai_recommendations, assessment, study, reports, ai_features, activity, activities  # noqa: E402

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(study_materials.router)
app.include_router(study.router)
app.include_router(progress.router)
app.include_router(ai_recommendations.router)
app.include_router(assessment.router)
app.include_router(reports.router)
app.include_router(ai_features.router)
app.include_router(activity.router)
app.include_router(activities.router)

# ─── V2 Extension: Classroom Engagement & ADHD Support ───────────────────────
from app.routers import v2_classroom, v2_clustering, v2_adhd, recordings  # noqa: E402

app.include_router(v2_classroom.router)
app.include_router(v2_clustering.router)
app.include_router(v2_adhd.router)
app.include_router(recordings.router)



# ─── Health & Root ────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["health"])
@app.get("/health", tags=["health"])
def health():
    """Health check endpoint — returns 200 when the API is running."""
    return {"status": "ok"}


@app.get("/", tags=["health"])
def root():
    return {"status": "BrainGraph API running"}


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", os.environ.get("port", settings.port or 8000)))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)

