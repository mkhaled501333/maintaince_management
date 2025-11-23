"""add_waiting_parts_status_to_maintenance_requests

Revision ID: 3cccd2b69458
Revises: a1b2c3d4e5f6
Create Date: 2025-10-29 08:54:50.093801

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3cccd2b69458'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add WAITING_PARTS to the requeststatus enum
    op.execute("ALTER TABLE maintenance_requests MODIFY COLUMN status ENUM('PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED') NOT NULL")


def downgrade() -> None:
    # Remove WAITING_PARTS from the requeststatus enum
    # First, update any WAITING_PARTS records to IN_PROGRESS
    op.execute("UPDATE maintenance_requests SET status = 'IN_PROGRESS' WHERE status = 'WAITING_PARTS'")
    # Then modify the enum to remove WAITING_PARTS
    op.execute("ALTER TABLE maintenance_requests MODIFY COLUMN status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL")
