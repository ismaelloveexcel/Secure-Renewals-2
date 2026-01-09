"""Add location_remarks and wfh_approval_confirmed fields for enhanced work location tracking

Revision ID: 20260109_0021
Revises: 20260109_0020
Create Date: 2026-01-09

This migration adds:
1. location_remarks - Details/remarks field (required for Sites, Meeting, Event, Work From Home)
2. wfh_approval_confirmed - WFH Approval Confirmed flag (employee self-confirms approval)
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260109_0021'
down_revision = '20260109_0020'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add location_remarks field (required for Sites, Meeting, Event, Work From Home)
    op.add_column('attendance_records',
        sa.Column('location_remarks', sa.Text(), nullable=True))
    
    # Add wfh_approval_confirmed flag (employee confirms they have Line Manager approval)
    op.add_column('attendance_records',
        sa.Column('wfh_approval_confirmed', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('attendance_records', 'wfh_approval_confirmed')
    op.drop_column('attendance_records', 'location_remarks')
