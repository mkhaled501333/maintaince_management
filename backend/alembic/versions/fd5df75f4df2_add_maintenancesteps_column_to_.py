"""add_maintenanceSteps_column_to_maintenance_works

Revision ID: fd5df75f4df2
Revises: 3cccd2b69458
Create Date: 2025-10-29 10:43:56.825567

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'fd5df75f4df2'
down_revision: Union[str, None] = '3cccd2b69458'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except Exception:
        return False


def upgrade() -> None:
    # Add maintenanceSteps column to maintenance_works table if it doesn't exist
    if not column_exists('maintenance_works', 'maintenanceSteps'):
        op.add_column('maintenance_works', sa.Column('maintenanceSteps', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove maintenanceSteps column from maintenance_works table if it exists
    if column_exists('maintenance_works', 'maintenanceSteps'):
        op.drop_column('maintenance_works', 'maintenanceSteps')
