"""add_maintenanceSteps_column_to_maintenance_works

Revision ID: fd5df75f4df2
Revises: 3cccd2b69458
Create Date: 2025-10-29 10:43:56.825567

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.exc import OperationalError


# revision identifiers, used by Alembic.
revision: str = 'fd5df75f4df2'
down_revision: Union[str, None] = '3cccd2b69458'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table (case-insensitive for MySQL)."""
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        # Case-insensitive check for MySQL compatibility
        return any(col.lower() == column_name.lower() for col in columns)
    except Exception:
        # Fallback: use direct SQL query
        try:
            result = bind.execute(
                sa.text(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() "
                    "AND TABLE_NAME = :table_name "
                    "AND COLUMN_NAME = :column_name"
                ),
                {"table_name": table_name, "column_name": column_name}
            )
            return result.scalar() > 0
        except Exception:
            return False


def upgrade() -> None:
    # Add maintenanceSteps column to maintenance_works table if it doesn't exist
    # Use try-except as a fallback in case column_exists check fails
    if not column_exists('maintenance_works', 'maintenanceSteps'):
        try:
            op.add_column('maintenance_works', sa.Column('maintenanceSteps', sa.JSON(), nullable=True))
        except OperationalError as e:
            # If column already exists (MySQL error 1060), ignore the error (idempotent operation)
            error_str = str(e)
            if '1060' in error_str or 'Duplicate column' in error_str:
                # Column already exists, skip
                pass
            else:
                # Re-raise other errors
                raise
        except Exception as e:
            # Catch any other exceptions and check if it's a duplicate column error
            error_str = str(e)
            if '1060' in error_str or 'Duplicate column' in error_str:
                # Column already exists, skip
                pass
            else:
                # Re-raise other errors
                raise


def downgrade() -> None:
    # Remove maintenanceSteps column from maintenance_works table if it exists
    if column_exists('maintenance_works', 'maintenanceSteps'):
        op.drop_column('maintenance_works', 'maintenanceSteps')
