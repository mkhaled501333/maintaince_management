"""add_sparepart_categories_table

Revision ID: c3d6e43f5a21
Revises: 205d7d00674d
Create Date: 2025-11-08 12:00:00.000000

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d6e43f5a21'
down_revision: Union[str, None] = '205d7d00674d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
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

    op.add_column('spareparts', sa.Column('categoryId', sa.Integer(), nullable=True))
    op.create_index('ix_spareparts_category_id', 'spareparts', ['categoryId'])
    op.create_foreign_key(
        'fk_spareparts_category',
        'spareparts',
        'sparepart_categories',
        ['categoryId'],
        ['id'],
        ondelete='SET NULL'
    )

    connection = op.get_bind()

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

    op.drop_column('spareparts', 'categoryNumber')
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

