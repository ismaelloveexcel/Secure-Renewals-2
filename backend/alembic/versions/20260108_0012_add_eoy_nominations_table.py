"""Add EOY nominations table

Revision ID: 20260108_0012
Revises: 20260107_0011_add_performance_tables
Create Date: 2026-01-08

"""
from alembic import op
import sqlalchemy as sa

revision = '20260108_0012'
down_revision = '20260107_0011'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'eoy_nominations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nominee_id', sa.Integer(), nullable=False),
        sa.Column('nominator_id', sa.Integer(), nullable=False),
        sa.Column('nomination_year', sa.Integer(), nullable=False),
        sa.Column('justification', sa.Text(), nullable=False),
        sa.Column('achievements', sa.Text(), nullable=True),
        sa.Column('impact_description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(30), nullable=False, server_default='pending'),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['nominee_id'], ['employees.id'], ),
        sa.ForeignKeyConstraint(['nominator_id'], ['employees.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by'], ['employees.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nominee_id', 'nominator_id', 'nomination_year', name='uq_nomination_per_year')
    )
    op.create_index('ix_eoy_nominations_id', 'eoy_nominations', ['id'])
    op.create_index('ix_eoy_nominations_nominee_id', 'eoy_nominations', ['nominee_id'])
    op.create_index('ix_eoy_nominations_nominator_id', 'eoy_nominations', ['nominator_id'])
    op.create_index('ix_eoy_nominations_nomination_year', 'eoy_nominations', ['nomination_year'])


def downgrade():
    op.drop_index('ix_eoy_nominations_nomination_year', table_name='eoy_nominations')
    op.drop_index('ix_eoy_nominations_nominator_id', table_name='eoy_nominations')
    op.drop_index('ix_eoy_nominations_nominee_id', table_name='eoy_nominations')
    op.drop_index('ix_eoy_nominations_id', table_name='eoy_nominations')
    op.drop_table('eoy_nominations')
