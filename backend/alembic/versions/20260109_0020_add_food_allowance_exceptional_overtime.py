"""Add food allowance, exceptional overtime, and paid overtime calculation fields

Revision ID: 20260109_0020
Revises: 20260109_0019
Create Date: 2026-01-09

This migration adds:
1. Food allowance tracking fields
2. Exceptional overtime override fields (for N/A/Offset employees getting paid OT)
3. Paid overtime calculation fields (rate, amount, night/holiday flags)
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260109_0020'
down_revision = '20260109_0019'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add exceptional overtime override fields
    # Allows marking specific days as paid overtime for employees who are normally N/A or Offset
    op.add_column('attendance_records',
        sa.Column('exceptional_overtime', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('attendance_records',
        sa.Column('exceptional_overtime_reason', sa.Text(), nullable=True))
    op.add_column('attendance_records',
        sa.Column('exceptional_overtime_approved_by', sa.Integer(), nullable=True))
    
    # Add paid overtime calculation fields
    # For employees with overtime_type = "Paid" or exceptional_overtime = True
    op.add_column('attendance_records',
        sa.Column('overtime_rate', sa.Numeric(4, 2), nullable=True))  # 1.25 or 1.50
    op.add_column('attendance_records',
        sa.Column('overtime_amount', sa.Numeric(10, 2), nullable=True))  # Calculated amount
    op.add_column('attendance_records',
        sa.Column('is_night_overtime', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('attendance_records',
        sa.Column('is_holiday_overtime', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add food/meal allowance tracking fields
    op.add_column('attendance_records',
        sa.Column('food_allowance_eligible', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('attendance_records',
        sa.Column('food_allowance_amount', sa.Numeric(8, 2), nullable=True))
    
    # Add foreign key constraint for exceptional_overtime_approved_by
    op.create_foreign_key(
        'fk_attendance_exceptional_overtime_approved_by',
        'attendance_records', 'employees',
        ['exceptional_overtime_approved_by'], ['id']
    )


def downgrade() -> None:
    # Drop foreign key
    op.drop_constraint('fk_attendance_exceptional_overtime_approved_by', 'attendance_records', type_='foreignkey')
    
    # Drop food allowance columns
    op.drop_column('attendance_records', 'food_allowance_amount')
    op.drop_column('attendance_records', 'food_allowance_eligible')
    
    # Drop paid overtime columns
    op.drop_column('attendance_records', 'is_holiday_overtime')
    op.drop_column('attendance_records', 'is_night_overtime')
    op.drop_column('attendance_records', 'overtime_amount')
    op.drop_column('attendance_records', 'overtime_rate')
    
    # Drop exceptional overtime columns
    op.drop_column('attendance_records', 'exceptional_overtime_approved_by')
    op.drop_column('attendance_records', 'exceptional_overtime_reason')
    op.drop_column('attendance_records', 'exceptional_overtime')
