"""add_sparepart_categories_table

Revision ID: c3d6e43f5a21
Revises: 205d7d00674d
Create Date: 2025-11-08 12:00:00.000000

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'c3d6e43f5a21'
down_revision: Union[str, None] = '205d7d00674d'
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
    except Exception:
        return False


def index_exists(table_name: str, index_name: str) -> bool:
    """Check if an index exists on a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
        return index_name in indexes
    except Exception:
        return False


def foreign_key_exists(table_name: str, fk_name: str) -> bool:
    """Check if a foreign key constraint exists."""
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        fks = [fk['name'] for fk in inspector.get_foreign_keys(table_name)]
        return fk_name in fks
    except Exception:
        return False


def upgrade() -> None:
    # Create sparepart_categories table if it doesn't exist
    if not table_exists('sparepart_categories'):
        op.create_table(
            'sparepart_categories',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('name', sa.String(length=200), nullable=False),
            sa.Column('code', sa.String(length=50), nullable=True, unique=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('isActive', sa.Boolean(), server_default=sa.true(), nullable=False),
        )

    # Add categoryId column if it doesn't exist
    if not column_exists('spareparts', 'categoryId'):
        op.add_column('spareparts', sa.Column('categoryId', sa.Integer(), nullable=True))
    
    # Create index if it doesn't exist
    if not index_exists('spareparts', 'ix_spareparts_category_id'):
        op.create_index('ix_spareparts_category_id', 'spareparts', ['categoryId'])
    
    # Create foreign key if it doesn't exist
    if not foreign_key_exists('spareparts', 'fk_spareparts_category'):
        op.create_foreign_key(
            'fk_spareparts_category',
            'spareparts',
            'sparepart_categories',
            ['categoryId'],
            ['id'],
            ondelete='SET NULL'
        )

    connection = op.get_bind()

    # Only migrate data if categoryNumber and categoryName columns still exist
    if column_exists('spareparts', 'categoryNumber') or column_exists('spareparts', 'categoryName'):
        distinct_categories = connection.execute(
            sa.text("""
                SELECT DISTINCT
                    NULLIF(TRIM(categoryNumber), '') AS categoryNumber,
                    NULLIF(TRIM(categoryName), '') AS categoryName
                FROM spareparts
                WHERE categoryNumber IS NOT NULL OR categoryName IS NOT NULL
            """)
        ).fetchall()

        now = datetime.utcnow()
        category_map = {}

        for row in distinct_categories:
            code = row.categoryNumber
            original_name = row.categoryName

            if not code and not original_name:
                continue

            display_name = original_name or code
            key = (code or None, original_name or None)

            if key not in category_map:
                existing_category_id = connection.execute(
                    sa.text("""
                        SELECT id FROM sparepart_categories
                        WHERE (:code IS NOT NULL AND code = :code)
                           OR (:name IS NOT NULL AND name = :name)
                        ORDER BY id ASC
                        LIMIT 1
                    """),
                    {'code': code, 'name': display_name}
                ).scalar()

                if existing_category_id is None:
                    connection.execute(
                        sa.text("""
                            INSERT INTO sparepart_categories (name, code, description, isActive, createdAt, updatedAt)
                            VALUES (:name, :code, :description, :isActive, :createdAt, :updatedAt)
                        """),
                        {
                            'name': display_name,
                            'code': code,
                            'description': None,
                            'isActive': True,
                            'createdAt': now,
                            'updatedAt': now,
                        }
                    )

                    existing_category_id = connection.execute(
                        sa.text("""
                            SELECT id FROM sparepart_categories
                            WHERE (:code IS NOT NULL AND code = :code)
                               OR (:name IS NOT NULL AND name = :name)
                            ORDER BY id DESC
                            LIMIT 1
                        """),
                        {'code': code, 'name': display_name}
                    ).scalar()

                category_map[key] = existing_category_id
            else:
                existing_category_id = category_map[key]

            connection.execute(
                sa.text("""
                    UPDATE spareparts
                    SET categoryId = :category_id
                    WHERE COALESCE(NULLIF(TRIM(categoryNumber), ''), '__NULL__') = COALESCE(:code_val, '__NULL__')
                      AND COALESCE(NULLIF(TRIM(categoryName), ''), '__NULL__') = COALESCE(:name_val, '__NULL__')
                """),
                {
                    'category_id': existing_category_id,
                    'code_val': code or '__NULL__',
                    'name_val': original_name or '__NULL__',
                }
            )

    # Drop categoryNumber and categoryName columns if they exist
    if column_exists('spareparts', 'categoryNumber'):
        op.drop_column('spareparts', 'categoryNumber')
    if column_exists('spareparts', 'categoryName'):
        op.drop_column('spareparts', 'categoryName')


def downgrade() -> None:
    op.add_column('spareparts', sa.Column('categoryName', sa.String(length=200), nullable=True))
    op.add_column('spareparts', sa.Column('categoryNumber', sa.String(length=50), nullable=True))

    connection = op.get_bind()

    connection.execute(
        sa.text("""
            UPDATE spareparts AS sp
            SET
                categoryNumber = cat.code,
                categoryName = cat.name
            FROM sparepart_categories AS cat
            WHERE sp.categoryId = cat.id
        """)
    )

    op.drop_constraint('fk_spareparts_category', 'spareparts', type_='foreignkey')
    op.drop_index('ix_spareparts_category_id', table_name='spareparts')
    op.drop_column('spareparts', 'categoryId')
    op.drop_table('sparepart_categories')

