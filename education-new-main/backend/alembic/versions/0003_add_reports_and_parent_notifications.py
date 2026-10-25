"""add reports and parent notifications

Revision ID: 0003_add_reports_and_parent_notifications
Revises: 0002_add_study_materials_fields
Create Date: 2026-08-26 19:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003_add_reports_and_parent_notifications'
down_revision: Union[str, None] = '0002_add_study_materials_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # 1. Add notification and parent fields to users table
    existing_user_columns = [col['name'] for col in inspector.get_columns('users')]
    if 'phone_number' not in existing_user_columns:
        op.add_column('users', sa.Column('phone_number', sa.String(length=50), nullable=True))
    if 'parent_email' not in existing_user_columns:
        op.add_column('users', sa.Column('parent_email', sa.String(length=255), nullable=True))
    if 'parent_phone_number' not in existing_user_columns:
        op.add_column('users', sa.Column('parent_phone_number', sa.String(length=50), nullable=True))
    if 'notify_on_completion' not in existing_user_columns:
        op.add_column('users', sa.Column('notify_on_completion', sa.Boolean(), server_default='true', nullable=True))

    # 2. Create reports table
    existing_tables = inspector.get_table_names()
    if 'reports' not in existing_tables:
        op.create_table(
            'reports',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('task_id', sa.Uuid(), nullable=True),
            sa.Column('session_id', sa.Uuid(), nullable=True),
            sa.Column('summary', sa.Text(), nullable=False),
            sa.Column('score', sa.Numeric(precision=5, scale=2), nullable=True),
            sa.Column('sent_via', sa.String(length=50), server_default='both', nullable=False),
            sa.Column('sent_status', sa.String(length=50), server_default='pending', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_reports_user_id'), 'reports', ['user_id'], unique=False)
        op.create_index(op.f('ix_reports_task_id'), 'reports', ['task_id'], unique=False)
        op.create_index(op.f('ix_reports_session_id'), 'reports', ['session_id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'reports' in existing_tables:
        op.drop_index(op.f('ix_reports_session_id'), table_name='reports')
        op.drop_index(op.f('ix_reports_task_id'), table_name='reports')
        op.drop_index(op.f('ix_reports_user_id'), table_name='reports')
        op.drop_table('reports')

    existing_user_columns = [col['name'] for col in inspector.get_columns('users')]
    if 'notify_on_completion' in existing_user_columns:
        op.drop_column('users', 'notify_on_completion')
    if 'parent_phone_number' in existing_user_columns:
        op.drop_column('users', 'parent_phone_number')
    if 'parent_email' in existing_user_columns:
        op.drop_column('users', 'parent_email')
    if 'phone_number' in existing_user_columns:
        op.drop_column('users', 'phone_number')
