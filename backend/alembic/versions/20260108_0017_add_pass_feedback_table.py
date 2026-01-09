"""Add pass feedback table

Revision ID: 0017
Revises: 20260108_0016
Create Date: 2026-01-08

"""
from alembic import op
import sqlalchemy as sa


revision = '20260108_0017'
down_revision = '20260108_0016'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'pass_feedback',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('recruitment_request_id', sa.Integer(), nullable=False),
        sa.Column('manager_id', sa.String(50), nullable=True),
        sa.Column('candidate_id', sa.Integer(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('feedback_text', sa.Text(), nullable=True),
        sa.Column('feedback_type', sa.String(50), server_default='general', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['recruitment_request_id'], ['recruitment_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pass_feedback_recruitment_request_id', 'pass_feedback', ['recruitment_request_id'])


def downgrade() -> None:
    op.drop_index('ix_pass_feedback_recruitment_request_id', table_name='pass_feedback')
    op.drop_table('pass_feedback')
