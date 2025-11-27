"""fix_useragent_column_size_in_activity_logs

Revision ID: 8bff2b68d45d
Revises: b0fb2e1ad020
Create Date: 2025-11-27 11:40:44.276319

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '8bff2b68d45d'
down_revision: Union[str, None] = 'b0fb2e1ad020'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except:
        return False


def upgrade() -> None:
    # Change userAgent column from VARCHAR(500) to TEXT to support longer user agent strings
    # Only alter if the column exists and is VARCHAR(500)
    if column_exists('activity_logs', 'userAgent'):
        # Check the current type - if it's already TEXT, skip
        bind = op.get_bind()
        inspector = inspect(bind)
        columns = inspector.get_columns('activity_logs')
        for col in columns:
            if col['name'] == 'userAgent':
                # If it's a String type (VARCHAR), change it to TEXT
                if isinstance(col['type'], sa.String):
                    op.alter_column('activity_logs', 'userAgent',
                                    existing_type=sa.String(length=500),
                                    type_=sa.Text(),
                                    existing_nullable=True)
                break


def downgrade() -> None:
    # Revert userAgent column back to VARCHAR(500) if it exists and is TEXT
    if column_exists('activity_logs', 'userAgent'):
        bind = op.get_bind()
        inspector = inspect(bind)
        columns = inspector.get_columns('activity_logs')
        for col in columns:
            if col['name'] == 'userAgent':
                # If it's a Text type, change it back to VARCHAR(500)
                if isinstance(col['type'], sa.Text):
                    op.alter_column('activity_logs', 'userAgent',
                                    existing_type=sa.Text(),
                                    type_=sa.String(length=500),
                                    existing_nullable=True)
                break
