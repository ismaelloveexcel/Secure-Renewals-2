"""Add interview scheduling tables

Revision ID: 0010
Revises: 20260104_0009
Create Date: 2026-01-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260106_0010'
down_revision = '20260104_0009_add_uae_compliance_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Interview Setups table
    op.create_table(
        'interview_setups',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('recruitment_request_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.String(20), nullable=False),
        sa.Column('technical_assessment_required', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('interview_format', sa.String(20), server_default='online', nullable=False),
        sa.Column('interview_rounds', sa.Integer(), server_default='1', nullable=False),
        sa.Column('additional_interviewers', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['recruitment_request_id'], ['recruitment_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_interview_setups_recruitment_request_id', 'interview_setups', ['recruitment_request_id'])

    # Interview Slots table
    op.create_table(
        'interview_slots',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('interview_setup_id', sa.Integer(), nullable=False),
        sa.Column('slot_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('round_number', sa.Integer(), server_default='1', nullable=False),
        sa.Column('status', sa.String(20), server_default='available', nullable=False),
        sa.Column('booked_by_candidate_id', sa.Integer(), nullable=True),
        sa.Column('booked_at', sa.DateTime(), nullable=True),
        sa.Column('candidate_confirmed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('candidate_confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['interview_setup_id'], ['interview_setups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['booked_by_candidate_id'], ['candidates.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_interview_slots_setup_id', 'interview_slots', ['interview_setup_id'])
    op.create_index('ix_interview_slots_slot_date', 'interview_slots', ['slot_date'])

    # Pass Messages table (inbox)
    op.create_table(
        'pass_messages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('pass_type', sa.String(20), nullable=False),
        sa.Column('pass_holder_id', sa.Integer(), nullable=False),
        sa.Column('recruitment_request_id', sa.Integer(), nullable=True),
        sa.Column('sender_type', sa.String(20), nullable=False),
        sa.Column('sender_id', sa.String(20), nullable=True),
        sa.Column('subject', sa.String(255), nullable=True),
        sa.Column('message_body', sa.Text(), nullable=True),
        sa.Column('message_type', sa.String(30), server_default='general', nullable=False),
        sa.Column('attachments', sa.JSON(), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pass_messages_pass_holder', 'pass_messages', ['pass_type', 'pass_holder_id'])

    # Recruitment Documents table
    op.create_table(
        'recruitment_documents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('recruitment_request_id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(50), nullable=False),
        sa.Column('document_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending', nullable=False),
        sa.Column('submitted_by', sa.String(20), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by', sa.String(20), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('version', sa.Integer(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['recruitment_request_id'], ['recruitment_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_recruitment_documents_request_id', 'recruitment_documents', ['recruitment_request_id'])


def downgrade() -> None:
    op.drop_table('recruitment_documents')
    op.drop_table('pass_messages')
    op.drop_table('interview_slots')
    op.drop_table('interview_setups')
