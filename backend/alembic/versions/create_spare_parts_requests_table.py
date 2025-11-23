"""create_spare_parts_requests_table

Revision ID: a1b2c3d4e5f6
Revises: 91bc6459bfe1
Create Date: 2025-01-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '91bc6459bfe1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create spare_parts_requests table
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


def downgrade() -> None:
    op.drop_index(op.f('ix_spare_parts_requests_requestedBy'), table_name='spare_parts_requests')
    op.drop_index(op.f('ix_spare_parts_requests_status'), table_name='spare_parts_requests')
    op.drop_index(op.f('ix_spare_parts_requests_sparePartId'), table_name='spare_parts_requests')
    op.drop_index(op.f('ix_spare_parts_requests_maintenanceWorkId'), table_name='spare_parts_requests')
    op.drop_index(op.f('ix_spare_parts_requests_id'), table_name='spare_parts_requests')
    op.drop_table('spare_parts_requests')
    op.execute('DROP TYPE IF EXISTS sparepartsrequeststatus')
