import os
import sys
from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool

from alembic import context

# Ensure the backend root (where `app/` lives) is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import from the SAME config/database modules that main.py uses
from app.config import settings           # app.config (not app.core.config)
from app.database import Base             # app.database (not app.db.session)

# Import every model module so their tables are registered on Base.metadata
import app.models       # noqa: F401  — users, tasks, study_materials, progress, etc.
import app.models_v2    # noqa: F401  — knowledge_bands, engagement_events, adhd_profile, etc.

# Alembic Config object
config = context.config

# Override the sqlalchemy.url in alembic.ini with the value from .env
config.set_main_option("sqlalchemy.url", settings.database_url)

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# This is the metadata Alembic uses for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no live DB connection needed)."""
    url = settings.database_url or config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode with a live DB connection."""
    db_url = settings.database_url or config.get_main_option("sqlalchemy.url")

    engine_kwargs: dict = {"poolclass": pool.NullPool}
    if db_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    elif db_url.startswith("postgresql") and "sslmode" not in db_url:
        engine_kwargs["connect_args"] = {"sslmode": "require"}

    connectable = create_engine(db_url, **engine_kwargs)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
