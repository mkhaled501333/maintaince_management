"""remove_departmentId_from_users_corrected

Revision ID: f2b013163803
Revises: 4a0c6cd6a0ee
Create Date: 2025-10-26 16:59:08.228957

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'f2b013163803'
down_revision: Union[str, None] = '4a0c6cd6a0ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = inspect(connection)
    
    # Check if constraint exists before dropping
    foreign_keys = inspector.get_foreign_keys('users')
    constraint_exists = any(fk['name'] == 'users_ibfk_1' for fk in foreign_keys)
    
    if constraint_exists:
        op.drop_constraint('users_ibfk_1', 'users', type_='foreignkey')
    
    # Check if column exists before dropping
    columns = [col['name'] for col in inspector.get_columns('users')]
    if 'departmentId' in columns:
        op.drop_column('users', 'departmentId')


def downgrade() -> None:
    connection = op.get_bind()
    inspector = inspect(connection)
    
    # Check if column exists before adding
    columns = [col['name'] for col in inspector.get_columns('users')]
    if 'departmentId' not in columns:
        op.add_column('users', sa.Column('departmentId', sa.Integer(), nullable=True))
    
    # Check if constraint exists before creating
    foreign_keys = inspector.get_foreign_keys('users')
    constraint_exists = any(fk['name'] == 'users_ibfk_1' for fk in foreign_keys)
    
    if not constraint_exists:
        op.create_foreign_key('users_ibfk_1', 'users', 'departments', ['departmentId'], ['id'])
