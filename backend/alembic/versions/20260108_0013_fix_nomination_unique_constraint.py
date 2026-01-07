"""Fix nomination unique constraint to be per nominee per year

Revision ID: 20260108_0013
Revises: 20260108_0012
Create Date: 2026-01-08

"""
from alembic import op

revision = '20260108_0013'
down_revision = '20260108_0012'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint('uq_nomination_per_year', 'eoy_nominations', type_='unique')
    op.create_unique_constraint(
        'uq_nominee_per_year', 
        'eoy_nominations', 
        ['nominee_id', 'nomination_year']
    )


def downgrade():
    op.drop_constraint('uq_nominee_per_year', 'eoy_nominations', type_='unique')
    op.create_unique_constraint(
        'uq_nomination_per_year', 
        'eoy_nominations', 
        ['nominee_id', 'nominator_id', 'nomination_year']
    )
