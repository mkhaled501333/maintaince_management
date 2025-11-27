"""add_ip_address_user_agent_to_activity_logs

Revision ID: 7dc9551f518a
Revises: fd5df75f4df2
Create Date: 2025-10-29 19:57:19.479023

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '7dc9551f518a'
down_revision: Union[str, None] = 'fd5df75f4df2'
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
    # Add ipAddress and userAgent columns to activity_logs table if they don't exist
    if not column_exists('activity_logs', 'ipAddress'):
        op.add_column('activity_logs', sa.Column('ipAddress', sa.String(length=45), nullable=True))
    if not column_exists('activity_logs', 'userAgent'):
        op.add_column('activity_logs', sa.Column('userAgent', sa.String(length=500), nullable=True))


def downgrade() -> None:
    # Remove ipAddress and userAgent columns from activity_logs table if they exist
    if column_exists('activity_logs', 'userAgent'):
        op.drop_column('activity_logs', 'userAgent')
    if column_exists('activity_logs', 'ipAddress'):
        op.drop_column('activity_logs', 'ipAddress')
