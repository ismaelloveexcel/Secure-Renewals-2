"""Add unique constraint for one nomination per manager per year

Revision ID: 20260108_0018
Revises: 20260108_0017
Create Date: 2026-01-08

"""
from alembic import op

revision = '20260108_0018'
down_revision = '20260108_0017'
branch_labels = None
depends_on = None


def upgrade():
    op.create_unique_constraint(
        'uq_nominator_per_year', 
        'eoy_nominations', 
        ['nominator_id', 'nomination_year']
    )


def downgrade():
    op.drop_constraint('uq_nominator_per_year', 'eoy_nominations', type_='unique')
