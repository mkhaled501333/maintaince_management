"""rename_name_to_partname_in_spare_parts

Revision ID: 91bc6459bfe1
Revises: de82bf4a8190
Create Date: 2025-10-28 18:45:24.293179

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '91bc6459bfe1'
down_revision: Union[str, None] = 'de82bf4a8190'
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
    # Check if the 'name' column exists and 'partName' doesn't before renaming
    if column_exists('spareparts', 'name') and not column_exists('spareparts', 'partName'):
        op.alter_column('spareparts', 'name',
                        new_column_name='partName',
                        existing_type=sa.String(length=200),
                        nullable=False)
    # If 'partName' already exists, skip the rename (idempotent)


def downgrade() -> None:
    # Check if the 'partName' column exists and 'name' doesn't before renaming back
    if column_exists('spareparts', 'partName') and not column_exists('spareparts', 'name'):
        op.alter_column('spareparts', 'partName',
                        new_column_name='name',
                        existing_type=sa.String(length=200),
                        nullable=False)
