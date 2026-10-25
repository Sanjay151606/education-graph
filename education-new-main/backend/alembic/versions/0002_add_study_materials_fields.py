"""add study materials fields

Revision ID: 0002_add_study_materials_fields
Revises: 0001_initial_schema
Create Date: 2026-08-26 19:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002_add_study_materials_fields'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely add new columns to study_materials if they do not already exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('study_materials')]

    if 'subject' not in existing_columns:
        op.add_column('study_materials', sa.Column('subject', sa.String(length=100), server_default='General', nullable=True))
    if 'topic' not in existing_columns:
        op.add_column('study_materials', sa.Column('topic', sa.String(length=150), server_default='', nullable=True))
    if 'knowledge_band_target' not in existing_columns:
        op.add_column('study_materials', sa.Column('knowledge_band_target', sa.String(length=50), server_default='all', nullable=True))
    if 'source_file_name' not in existing_columns:
        op.add_column('study_materials', sa.Column('source_file_name', sa.String(length=255), nullable=True))
    if 'file_name' not in existing_columns:
        op.add_column('study_materials', sa.Column('file_name', sa.String(length=255), nullable=True))
    if 'file_path' not in existing_columns:
        op.add_column('study_materials', sa.Column('file_path', sa.String(length=500), nullable=True))
    if 'file_type' not in existing_columns:
        op.add_column('study_materials', sa.Column('file_type', sa.String(length=100), nullable=True))
    if 'file_size' not in existing_columns:
        op.add_column('study_materials', sa.Column('file_size', sa.Integer(), nullable=True))
    if 'visibility' not in existing_columns:
        op.add_column('study_materials', sa.Column('visibility', sa.String(length=20), server_default='published', nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('study_materials')]

    if 'knowledge_band_target' in existing_columns:
        op.drop_column('study_materials', 'knowledge_band_target')
    if 'source_file_name' in existing_columns:
        op.drop_column('study_materials', 'source_file_name')
