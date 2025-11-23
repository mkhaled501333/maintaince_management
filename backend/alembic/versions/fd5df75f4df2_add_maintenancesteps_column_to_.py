"""add_maintenanceSteps_column_to_maintenance_works

Revision ID: fd5df75f4df2
Revises: 3cccd2b69458
Create Date: 2025-10-29 10:43:56.825567

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd5df75f4df2'
down_revision: Union[str, None] = '3cccd2b69458'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add maintenanceSteps column to maintenance_works table
    op.add_column('maintenance_works', sa.Column('maintenanceSteps', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove maintenanceSteps column from maintenance_works table
    op.drop_column('maintenance_works', 'maintenanceSteps')
