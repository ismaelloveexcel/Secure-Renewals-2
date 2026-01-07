"""Add masterfile FK links to passes, recruitment_requests, and candidates

Revision ID: 20260108_0014
Revises: 20260108_0013
Create Date: 2026-01-08

Links Pass, RecruitmentRequest, and Candidate models back to the
employees masterfile with proper ForeignKey relationships.
"""
from alembic import op
import sqlalchemy as sa

revision = '20260108_0014'
down_revision = '20260108_0013'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table."""
    bind = op.get_bind()
    result = bind.execute(sa.text(
        f"SELECT EXISTS (SELECT 1 FROM information_schema.columns "
        f"WHERE table_name = '{table_name}' AND column_name = '{column_name}')"
    ))
    return result.scalar()


def upgrade():
    # Add FK columns to passes table
    if not column_exists('passes', 'linked_employee_id'):
        op.add_column('passes', sa.Column('linked_employee_id', sa.Integer(), nullable=True))
        op.create_index('ix_passes_linked_employee_id', 'passes', ['linked_employee_id'])
        op.create_foreign_key(
            'fk_passes_linked_employee', 'passes', 'employees',
            ['linked_employee_id'], ['id'], ondelete='SET NULL'
        )
    
    if not column_exists('passes', 'created_by_employee_id'):
        op.add_column('passes', sa.Column('created_by_employee_id', sa.Integer(), nullable=True))
        op.create_index('ix_passes_created_by_employee_id', 'passes', ['created_by_employee_id'])
        op.create_foreign_key(
            'fk_passes_created_by_employee', 'passes', 'employees',
            ['created_by_employee_id'], ['id'], ondelete='SET NULL'
        )
    
    # Fix hiring_manager_employee_id - drop wrong type and recreate as integer
    if column_exists('recruitment_requests', 'hiring_manager_employee_id'):
        op.drop_column('recruitment_requests', 'hiring_manager_employee_id')
    op.add_column('recruitment_requests', sa.Column('hiring_manager_employee_id', sa.Integer(), nullable=True))
    op.create_index('ix_recruitment_requests_hiring_manager_employee_id', 'recruitment_requests', ['hiring_manager_employee_id'])
    op.create_foreign_key(
        'fk_recruitment_requests_hiring_manager', 'recruitment_requests', 'employees',
        ['hiring_manager_employee_id'], ['id'], ondelete='SET NULL'
    )
    
    if not column_exists('recruitment_requests', 'requested_by_employee_id'):
        op.add_column('recruitment_requests', sa.Column('requested_by_employee_id', sa.Integer(), nullable=True))
        op.create_index('ix_recruitment_requests_requested_by_employee_id', 'recruitment_requests', ['requested_by_employee_id'])
        op.create_foreign_key(
            'fk_recruitment_requests_requested_by', 'recruitment_requests', 'employees',
            ['requested_by_employee_id'], ['id'], ondelete='SET NULL'
        )
    
    if not column_exists('recruitment_requests', 'manager_pass_id'):
        op.add_column('recruitment_requests', sa.Column('manager_pass_id', sa.Integer(), nullable=True))
        op.create_index('ix_recruitment_requests_manager_pass_id', 'recruitment_requests', ['manager_pass_id'])
        op.create_foreign_key(
            'fk_recruitment_requests_manager_pass', 'recruitment_requests', 'passes',
            ['manager_pass_id'], ['id'], ondelete='SET NULL'
        )
    
    # Add FK column to candidates table
    if not column_exists('candidates', 'pass_id'):
        op.add_column('candidates', sa.Column('pass_id', sa.Integer(), nullable=True))
        op.create_index('ix_candidates_pass_id', 'candidates', ['pass_id'])
        op.create_foreign_key(
            'fk_candidates_pass', 'candidates', 'passes',
            ['pass_id'], ['id'], ondelete='SET NULL'
        )


def downgrade():
    # Remove FK from candidates
    if column_exists('candidates', 'pass_id'):
        op.drop_constraint('fk_candidates_pass', 'candidates', type_='foreignkey')
        op.drop_index('ix_candidates_pass_id', table_name='candidates')
        op.drop_column('candidates', 'pass_id')
    
    # Remove FKs from recruitment_requests
    if column_exists('recruitment_requests', 'manager_pass_id'):
        op.drop_constraint('fk_recruitment_requests_manager_pass', 'recruitment_requests', type_='foreignkey')
        op.drop_index('ix_recruitment_requests_manager_pass_id', table_name='recruitment_requests')
        op.drop_column('recruitment_requests', 'manager_pass_id')
    
    if column_exists('recruitment_requests', 'requested_by_employee_id'):
        op.drop_constraint('fk_recruitment_requests_requested_by', 'recruitment_requests', type_='foreignkey')
        op.drop_index('ix_recruitment_requests_requested_by_employee_id', table_name='recruitment_requests')
        op.drop_column('recruitment_requests', 'requested_by_employee_id')
    
    if column_exists('recruitment_requests', 'hiring_manager_employee_id'):
        op.drop_constraint('fk_recruitment_requests_hiring_manager', 'recruitment_requests', type_='foreignkey')
        op.drop_index('ix_recruitment_requests_hiring_manager_employee_id', table_name='recruitment_requests')
        op.drop_column('recruitment_requests', 'hiring_manager_employee_id')
    
    # Remove FKs from passes
    if column_exists('passes', 'created_by_employee_id'):
        op.drop_constraint('fk_passes_created_by_employee', 'passes', type_='foreignkey')
        op.drop_index('ix_passes_created_by_employee_id', table_name='passes')
        op.drop_column('passes', 'created_by_employee_id')
    
    if column_exists('passes', 'linked_employee_id'):
        op.drop_constraint('fk_passes_linked_employee', 'passes', type_='foreignkey')
        op.drop_index('ix_passes_linked_employee_id', table_name='passes')
        op.drop_column('passes', 'linked_employee_id')
