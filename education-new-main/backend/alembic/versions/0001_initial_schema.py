"""initial schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-25 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Tasks table
    op.create_table(
        'tasks',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', name='task_priority'), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.Enum('pending', 'in_progress', 'done', name='task_status'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)
    op.create_index(op.f('ix_tasks_status'), 'tasks', ['status'], unique=False)
    op.create_index(op.f('ix_tasks_due_date'), 'tasks', ['due_date'], unique=False)

    # 3. Study Materials table
    op.create_table(
        'study_materials',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('original_content', sa.Text(), nullable=True),
        sa.Column('simplified_content', sa.Text(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_study_materials_user_id'), 'study_materials', ['user_id'], unique=False)

    # 4. Focus Sessions table
    op.create_table(
        'focus_sessions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('interruptions', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_focus_sessions_user_id'), 'focus_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_focus_sessions_start_time'), 'focus_sessions', ['start_time'], unique=False)

    # 5. Progress table
    op.create_table(
        'progress',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_progress_user_id'), 'progress', ['user_id'], unique=False)
    op.create_index(op.f('ix_progress_subject'), 'progress', ['subject'], unique=False)
    op.create_index(op.f('ix_progress_date'), 'progress', ['date'], unique=False)

    # 6. AI Recommendations table
    op.create_table(
        'ai_recommendations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('type', sa.String(length=100), nullable=False),
        sa.Column('subtype', sa.String(length=100), nullable=True),
        sa.Column('content', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_recommendations_user_id'), 'ai_recommendations', ['user_id'], unique=False)
    op.create_index(op.f('ix_ai_recommendations_type'), 'ai_recommendations', ['type'], unique=False)

    # 7. Knowledge Bands table
    op.create_table(
        'knowledge_bands',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('topic_id', sa.String(length=255), nullable=False),
        sa.Column('band', sa.Enum('foundation', 'on_track', 'advanced', name='band_level'), nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_knowledge_bands_user_id'), 'knowledge_bands', ['user_id'], unique=False)
    op.create_index(op.f('ix_knowledge_bands_topic_id'), 'knowledge_bands', ['topic_id'], unique=False)
    op.create_index(op.f('ix_knowledge_bands_band'), 'knowledge_bands', ['band'], unique=False)

    # 8. Engagement Events table
    op.create_table(
        'engagement_events',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('session_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('state', sa.Enum('focused', 'mild_confusion', 'lost', 'disengaged', name='engagement_state'), nullable=False),
        sa.Column('confidence', sa.Numeric(precision=4, scale=3), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('confidence >= 0 AND confidence <= 1', name='ck_engagement_events_confidence_range'),
        sa.ForeignKeyConstraint(['session_id'], ['focus_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_engagement_events_session_id'), 'engagement_events', ['session_id'], unique=False)
    op.create_index(op.f('ix_engagement_events_user_id'), 'engagement_events', ['user_id'], unique=False)
    op.create_index(op.f('ix_engagement_events_timestamp'), 'engagement_events', ['timestamp'], unique=False)
    op.create_index(op.f('ix_engagement_events_state'), 'engagement_events', ['state'], unique=False)

    # 9. ADHD Profile table (1-to-1 with users)
    op.create_table(
        'adhd_profile',
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('focus_span_avg_minutes', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('preferred_break_interval', sa.Integer(), nullable=True),
        sa.Column('reduced_stimulation_enabled', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('chunking_preference', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index(op.f('ix_adhd_profile_user_id'), 'adhd_profile', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_adhd_profile_user_id'), table_name='adhd_profile')
    op.drop_table('adhd_profile')

    op.drop_index(op.f('ix_engagement_events_state'), table_name='engagement_events')
    op.drop_index(op.f('ix_engagement_events_timestamp'), table_name='engagement_events')
    op.drop_index(op.f('ix_engagement_events_user_id'), table_name='engagement_events')
    op.drop_index(op.f('ix_engagement_events_session_id'), table_name='engagement_events')
    op.drop_table('engagement_events')
    op.execute('DROP TYPE IF EXISTS engagement_state')

    op.drop_index(op.f('ix_knowledge_bands_band'), table_name='knowledge_bands')
    op.drop_index(op.f('ix_knowledge_bands_topic_id'), table_name='knowledge_bands')
    op.drop_index(op.f('ix_knowledge_bands_user_id'), table_name='knowledge_bands')
    op.drop_table('knowledge_bands')
    op.execute('DROP TYPE IF EXISTS band_level')

    op.drop_index(op.f('ix_ai_recommendations_type'), table_name='ai_recommendations')
    op.drop_index(op.f('ix_ai_recommendations_user_id'), table_name='ai_recommendations')
    op.drop_table('ai_recommendations')

    op.drop_index(op.f('ix_progress_date'), table_name='progress')
    op.drop_index(op.f('ix_progress_subject'), table_name='progress')
    op.drop_index(op.f('ix_progress_user_id'), table_name='progress')
    op.drop_table('progress')

    op.drop_index(op.f('ix_focus_sessions_start_time'), table_name='focus_sessions')
    op.drop_index(op.f('ix_focus_sessions_user_id'), table_name='focus_sessions')
    op.drop_table('focus_sessions')

    op.drop_index(op.f('ix_study_materials_user_id'), table_name='study_materials')
    op.drop_table('study_materials')

    op.drop_index(op.f('ix_tasks_due_date'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_status'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_user_id'), table_name='tasks')
    op.drop_table('tasks')
    op.execute('DROP TYPE IF EXISTS task_status')
    op.execute('DROP TYPE IF EXISTS task_priority')

    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
