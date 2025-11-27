"""add_image_url_to_machines

Revision ID: 028f4c7202fa
Revises: b9b6019bceca
Create Date: 2025-11-13 09:10:47.769418

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '028f4c7202fa'
down_revision: Union[str, None] = 'b9b6019bceca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database."""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except:
        return False


def index_exists(table_name: str, index_name: str) -> bool:
    """Check if an index exists on a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
        return index_name in indexes
    except:
        return False


def upgrade() -> None:
    # Add imageUrl column to machines if it doesn't exist
    if not column_exists('machines', 'imageUrl'):
        op.add_column('machines', sa.Column('imageUrl', sa.String(length=500), nullable=True))
    
    # Note: We skip dropping indexes on spare_parts_requests because:
    # - maintenanceWorkId, sparePartId, requestedBy indexes are needed for foreign key constraints
    # - status index can be kept as it's useful for queries
    # These indexes don't need to be dropped and recreated
    
    # Create index on sparepart_categories if table exists and index doesn't
    if table_exists('sparepart_categories') and not index_exists('sparepart_categories', 'ix_sparepart_categories_id'):
        op.create_index(op.f('ix_sparepart_categories_id'), 'sparepart_categories', ['id'], unique=False)
    
    # Note: We skip dropping ix_spareparts_category_id because it's needed for the foreign key constraint
    # on categoryId -> sparepart_categories.id


def downgrade() -> None:
    # Drop imageUrl column if it exists
    if column_exists('machines', 'imageUrl'):
        op.drop_column('machines', 'imageUrl')
    
    # Note: We don't recreate ix_spareparts_category_id in downgrade because:
    # - It's needed for the foreign key constraint and is automatically managed by MySQL
    
    # Drop index on sparepart_categories if it exists
    if table_exists('sparepart_categories') and index_exists('sparepart_categories', 'ix_sparepart_categories_id'):
        op.drop_index(op.f('ix_sparepart_categories_id'), table_name='sparepart_categories')
    
    # Note: We don't recreate indexes on spare_parts_requests in downgrade because:
    # - Foreign key indexes are automatically managed by MySQL
    # - The status index recreation is optional and not critical
