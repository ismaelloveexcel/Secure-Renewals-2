"""Add UAE compliance fields to employees

Revision ID: 20260104_0009_add_uae_compliance_fields
Revises: 20260103_0008_add_audit_logs_and_notifications
Create Date: 2026-01-04

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260104_0009_add_uae_compliance_fields'
down_revision = '20260103_0008_add_audit_logs_and_notifications'
branch_labels = None
depends_on = None


def upgrade():
    # Visa tracking (detailed)
    op.add_column('employees', sa.Column('visa_number', sa.String(50), nullable=True))
    op.add_column('employees', sa.Column('visa_issue_date', sa.Date(), nullable=True))
    op.add_column('employees', sa.Column('visa_expiry_date', sa.Date(), nullable=True))
    
    # Emirates ID
    op.add_column('employees', sa.Column('emirates_id_number', sa.String(20), nullable=True))
    op.add_column('employees', sa.Column('emirates_id_expiry', sa.Date(), nullable=True))
    
    # Medical Fitness
    op.add_column('employees', sa.Column('medical_fitness_date', sa.Date(), nullable=True))
    op.add_column('employees', sa.Column('medical_fitness_expiry', sa.Date(), nullable=True))
    
    # ILOE (Insurance)
    op.add_column('employees', sa.Column('iloe_status', sa.String(50), nullable=True))
    op.add_column('employees', sa.Column('iloe_expiry', sa.Date(), nullable=True))
    
    # Contract
    op.add_column('employees', sa.Column('contract_type', sa.String(50), nullable=True))
    op.add_column('employees', sa.Column('contract_start_date', sa.Date(), nullable=True))
    op.add_column('employees', sa.Column('contract_end_date', sa.Date(), nullable=True))


def downgrade():
    # Remove contract fields
    op.drop_column('employees', 'contract_end_date')
    op.drop_column('employees', 'contract_start_date')
    op.drop_column('employees', 'contract_type')
    
    # Remove ILOE fields
    op.drop_column('employees', 'iloe_expiry')
    op.drop_column('employees', 'iloe_status')
    
    # Remove medical fitness fields
    op.drop_column('employees', 'medical_fitness_expiry')
    op.drop_column('employees', 'medical_fitness_date')
    
    # Remove Emirates ID fields
    op.drop_column('employees', 'emirates_id_expiry')
    op.drop_column('employees', 'emirates_id_number')
    
    # Remove visa fields
    op.drop_column('employees', 'visa_expiry_date')
    op.drop_column('employees', 'visa_issue_date')
    op.drop_column('employees', 'visa_number')
