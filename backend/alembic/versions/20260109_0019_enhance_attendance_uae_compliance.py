"""Enhance attendance module with UAE Labor Law compliance and employee work settings integration

Revision ID: 20260109_0019
Revises: 20260108_0018
Create Date: 2026-01-09

This migration adds:
1. work_location field to link attendance to employee master location
2. offset_hours_earned and offset_day_reference for offset tracking
3. UAE Labor Law compliance flags (ramadan hours, rest day, daily/overtime limits)
4. Manual entry/correction workflow fields
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260109_0019'
down_revision = '20260108_0018'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add work_location field - linked from Employee master but can be overridden
    op.add_column('attendance_records', 
        sa.Column('work_location', sa.String(100), nullable=True))
    
    # Add offset day tracking fields (for employees with overtime_type = "Offset")
    op.add_column('attendance_records',
        sa.Column('offset_hours_earned', sa.Numeric(5, 2), nullable=True))
    op.add_column('attendance_records',
        sa.Column('offset_day_reference', sa.String(100), nullable=True))
    
    # Add UAE Labor Law compliance flags
    op.add_column('attendance_records',
        sa.Column('is_ramadan_hours', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('attendance_records',
        sa.Column('is_rest_day', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('attendance_records',
        sa.Column('exceeds_daily_limit', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('attendance_records',
        sa.Column('exceeds_overtime_limit', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add manual entry/correction workflow fields
    op.add_column('attendance_records',
        sa.Column('is_manual_entry', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('attendance_records',
        sa.Column('manual_entry_reason', sa.Text(), nullable=True))
    op.add_column('attendance_records',
        sa.Column('manual_entry_by', sa.Integer(), nullable=True))
    op.add_column('attendance_records',
        sa.Column('manual_entry_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('attendance_records',
        sa.Column('correction_approved', sa.Boolean(), nullable=True))
    op.add_column('attendance_records',
        sa.Column('correction_approved_by', sa.Integer(), nullable=True))
    op.add_column('attendance_records',
        sa.Column('correction_approved_at', sa.DateTime(timezone=True), nullable=True))
    
    # Add foreign key constraints for new approver fields
    op.create_foreign_key(
        'fk_attendance_manual_entry_by',
        'attendance_records', 'employees',
        ['manual_entry_by'], ['id']
    )
    op.create_foreign_key(
        'fk_attendance_correction_approved_by',
        'attendance_records', 'employees',
        ['correction_approved_by'], ['id']
    )
    
    # Create index for work_location for filtering
    op.create_index('ix_attendance_records_work_location', 'attendance_records', ['work_location'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_attendance_records_work_location', table_name='attendance_records')
    
    # Drop foreign keys
    op.drop_constraint('fk_attendance_correction_approved_by', 'attendance_records', type_='foreignkey')
    op.drop_constraint('fk_attendance_manual_entry_by', 'attendance_records', type_='foreignkey')
    
    # Drop manual entry/correction columns
    op.drop_column('attendance_records', 'correction_approved_at')
    op.drop_column('attendance_records', 'correction_approved_by')
    op.drop_column('attendance_records', 'correction_approved')
    op.drop_column('attendance_records', 'manual_entry_at')
    op.drop_column('attendance_records', 'manual_entry_by')
    op.drop_column('attendance_records', 'manual_entry_reason')
    op.drop_column('attendance_records', 'is_manual_entry')
    
    # Drop UAE compliance columns
    op.drop_column('attendance_records', 'exceeds_overtime_limit')
    op.drop_column('attendance_records', 'exceeds_daily_limit')
    op.drop_column('attendance_records', 'is_rest_day')
    op.drop_column('attendance_records', 'is_ramadan_hours')
    
    # Drop offset tracking columns
    op.drop_column('attendance_records', 'offset_day_reference')
    op.drop_column('attendance_records', 'offset_hours_earned')
    
    # Drop work_location column
    op.drop_column('attendance_records', 'work_location')
