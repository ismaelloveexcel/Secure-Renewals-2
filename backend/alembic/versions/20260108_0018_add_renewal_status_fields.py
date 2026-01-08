"""add renewal status and dha/doh validation fields to insurance census

Revision ID: 0018
Revises: 0017
Create Date: 2026-01-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = '20260108_0018'
down_revision = '20260108_0017'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add DHA/DOH validation fields
    op.add_column('insurance_census_records', 
        sa.Column('dha_doh_missing_fields', JSON, nullable=True))
    op.add_column('insurance_census_records', 
        sa.Column('dha_doh_valid', sa.Boolean(), nullable=True, default=False))
    
    # Add renewal status tracking fields
    op.add_column('insurance_census_records', 
        sa.Column('renewal_status', sa.String(20), nullable=True, default='existing'))
    op.add_column('insurance_census_records', 
        sa.Column('renewal_effective_date', sa.String(50), nullable=True))
    
    # Add amendment tracking field
    op.add_column('insurance_census_records', 
        sa.Column('amended_fields', JSON, nullable=True))


def downgrade() -> None:
    op.drop_column('insurance_census_records', 'amended_fields')
    op.drop_column('insurance_census_records', 'renewal_effective_date')
    op.drop_column('insurance_census_records', 'renewal_status')
    op.drop_column('insurance_census_records', 'dha_doh_valid')
    op.drop_column('insurance_census_records', 'dha_doh_missing_fields')
