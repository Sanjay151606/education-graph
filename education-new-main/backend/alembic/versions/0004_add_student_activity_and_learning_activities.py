"""add student activity and learning activities tables

Revision ID: 0004_add_student_activity_and_learning_activities
Revises: 0003_add_reports_and_parent_notifications
Create Date: 2026-08-26 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0004_add_student_activity_and_learning_activities'
down_revision: Union[str, None] = '0003_add_reports_and_parent_notifications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # 1. Create student_activity table
    if 'student_activity' not in existing_tables:
        op.create_table(
            'student_activity',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('activity_type', sa.String(length=100), nullable=False),
            sa.Column('reference_id', sa.Uuid(), nullable=True),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_student_activity_user_id_created_at'), 'student_activity', ['user_id', 'created_at'], unique=False)
        op.create_index(op.f('ix_student_activity_activity_type'), 'student_activity', ['activity_type'], unique=False)

    # 2. Create activities table
    if 'activities' not in existing_tables:
        op.create_table(
            'activities',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('material_id', sa.Uuid(), nullable=True),
            sa.Column('teacher_id', sa.Uuid(), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False, server_default='Interactive Activity'),
            sa.Column('type', sa.String(length=50), nullable=False),
            sa.Column('knowledge_band', sa.String(length=50), nullable=False, server_default='all'),
            sa.Column('content', sa.JSON(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['material_id'], ['study_materials.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_activities_material_id'), 'activities', ['material_id'], unique=False)
        op.create_index(op.f('ix_activities_knowledge_band'), 'activities', ['knowledge_band'], unique=False)

    # 3. Create activity_attempts table
    if 'activity_attempts' not in existing_tables:
        op.create_table(
            'activity_attempts',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('activity_id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('score', sa.Numeric(precision=5, scale=2), nullable=True),
            sa.Column('responses', sa.JSON(), nullable=True),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_activity_attempts_activity_id'), 'activity_attempts', ['activity_id'], unique=False)
        op.create_index(op.f('ix_activity_attempts_user_id'), 'activity_attempts', ['user_id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'activity_attempts' in existing_tables:
        op.drop_index(op.f('ix_activity_attempts_user_id'), table_name='activity_attempts')
        op.drop_index(op.f('ix_activity_attempts_activity_id'), table_name='activity_attempts')
        op.drop_table('activity_attempts')

    if 'activities' in existing_tables:
        op.drop_index(op.f('ix_activities_knowledge_band'), table_name='activities')
        op.drop_index(op.f('ix_activities_material_id'), table_name='activities')
        op.drop_table('activities')

    if 'student_activity' in existing_tables:
        op.drop_index(op.f('ix_student_activity_activity_type'), table_name='student_activity')
        op.drop_index(op.f('ix_student_activity_user_id_created_at'), table_name='student_activity')
        op.drop_table('student_activity')
