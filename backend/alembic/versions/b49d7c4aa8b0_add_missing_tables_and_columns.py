"""add_missing_tables_and_columns

Revision ID: b49d7c4aa8b0
Revises: 8bff2b68d45d
Create Date: 2025-11-27 11:41:48.462578

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'b49d7c4aa8b0'
down_revision: Union[str, None] = '8bff2b68d45d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database."""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # Check and create spare_parts_requests table if it doesn't exist
    if not table_exists('spare_parts_requests'):
        op.create_table('spare_parts_requests',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
            sa.Column('maintenanceWorkId', sa.Integer(), nullable=False),
            sa.Column('sparePartId', sa.Integer(), nullable=False),
            sa.Column('quantityRequested', sa.Integer(), nullable=False),
            sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', 'ISSUED', name='sparepartsrequeststatus'), nullable=False, server_default='PENDING'),
            sa.Column('requestedBy', sa.Integer(), nullable=False),
            sa.Column('approvedBy', sa.Integer(), nullable=True),
            sa.Column('approvedAt', sa.DateTime(timezone=True), nullable=True),
            sa.Column('rejectionReason', sa.Text(), nullable=True),
            sa.Column('approvalNotes', sa.Text(), nullable=True),
            sa.Column('is_requested_return', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('return_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('is_returned', sa.Boolean(), nullable=False, server_default='false'),
            sa.ForeignKeyConstraint(['maintenanceWorkId'], ['maintenance_works.id'], ),
            sa.ForeignKeyConstraint(['sparePartId'], ['spareparts.id'], ),
            sa.ForeignKeyConstraint(['requestedBy'], ['users.id'], ),
            sa.ForeignKeyConstraint(['approvedBy'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_spare_parts_requests_id'), 'spare_parts_requests', ['id'], unique=False)
        op.create_index(op.f('ix_spare_parts_requests_maintenanceWorkId'), 'spare_parts_requests', ['maintenanceWorkId'], unique=False)
        op.create_index(op.f('ix_spare_parts_requests_sparePartId'), 'spare_parts_requests', ['sparePartId'], unique=False)
        op.create_index(op.f('ix_spare_parts_requests_status'), 'spare_parts_requests', ['status'], unique=False)
        op.create_index(op.f('ix_spare_parts_requests_requestedBy'), 'spare_parts_requests', ['requestedBy'], unique=False)
    
    # Check and add return fields to spare_parts_requests if they don't exist
    if table_exists('spare_parts_requests'):
        if not column_exists('spare_parts_requests', 'is_requested_return'):
            op.add_column('spare_parts_requests', sa.Column('is_requested_return', sa.Boolean(), nullable=False, server_default='false'))
        if not column_exists('spare_parts_requests', 'return_date'):
            op.add_column('spare_parts_requests', sa.Column('return_date', sa.DateTime(timezone=True), nullable=True))
        if not column_exists('spare_parts_requests', 'is_returned'):
            op.add_column('spare_parts_requests', sa.Column('is_returned', sa.Boolean(), nullable=False, server_default='false'))
    
    # Check and add maintenanceSteps column to maintenance_works if it doesn't exist
    if table_exists('maintenance_works') and not column_exists('maintenance_works', 'maintenanceSteps'):
        op.add_column('maintenance_works', sa.Column('maintenanceSteps', sa.JSON(), nullable=True))
    
    # Check and add ipAddress and userAgent columns to activity_logs if they don't exist
    if table_exists('activity_logs'):
        if not column_exists('activity_logs', 'ipAddress'):
            op.add_column('activity_logs', sa.Column('ipAddress', sa.String(length=45), nullable=True))
        # Note: userAgent will be fixed to TEXT in the previous migration (8bff2b68d45d)
        if not column_exists('activity_logs', 'userAgent'):
            op.add_column('activity_logs', sa.Column('userAgent', sa.Text(), nullable=True))


def downgrade() -> None:
    # This is a catch-up migration, so downgrade should be minimal
    # We don't want to remove things that might have been created by other migrations
    pass
