"""add_return_fields_to_spare_parts_requests

Revision ID: b0fb2e1ad020
Revises: 028f4c7202fa
Create Date: 2025-11-18 14:30:00.361947

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b0fb2e1ad020'
down_revision: Union[str, None] = '028f4c7202fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add return fields to spare_parts_requests table
    op.add_column('spare_parts_requests', sa.Column('is_requested_return', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('spare_parts_requests', sa.Column('return_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('spare_parts_requests', sa.Column('is_returned', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove return fields from spare_parts_requests table
    op.drop_column('spare_parts_requests', 'is_returned')
    op.drop_column('spare_parts_requests', 'return_date')
    op.drop_column('spare_parts_requests', 'is_requested_return')
