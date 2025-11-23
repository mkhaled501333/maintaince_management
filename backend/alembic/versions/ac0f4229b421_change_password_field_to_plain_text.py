"""change_password_field_to_plain_text

Revision ID: ac0f4229b421
Revises: 04cf5dd8b660
Create Date: 2025-10-26 16:11:30.288876

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac0f4229b421'
down_revision: Union[str, None] = '04cf5dd8b660'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename hashedPassword column to password (MySQL requires existing type)
    op.alter_column('users', 'hashedPassword', 
                   new_column_name='password',
                   existing_type=sa.String(255))


def downgrade() -> None:
    # Rename password column back to hashedPassword (MySQL requires existing type)
    op.alter_column('users', 'password', 
                   new_column_name='hashedPassword',
                   existing_type=sa.String(255))
