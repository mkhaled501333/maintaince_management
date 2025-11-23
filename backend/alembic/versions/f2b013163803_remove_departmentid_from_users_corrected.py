"""remove_departmentId_from_users_corrected

Revision ID: f2b013163803
Revises: 4a0c6cd6a0ee
Create Date: 2025-10-26 16:59:08.228957

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2b013163803'
down_revision: Union[str, None] = '4a0c6cd6a0ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove foreign key constraint first
    op.drop_constraint('users_ibfk_1', 'users', type_='foreignkey')
    # Remove departmentId column
    op.drop_column('users', 'departmentId')


def downgrade() -> None:
    # Add departmentId column back
    op.add_column('users', sa.Column('departmentId', sa.Integer(), nullable=True))
    # Add foreign key constraint back
    op.create_foreign_key('users_ibfk_1', 'users', 'departments', ['departmentId'], ['id'])
