"""fix product timestamps

Revision ID: 8c6f10e6380a
Revises: 3c566c1bfb00
Create Date: 2026-09-06 00:20:34.082905

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8c6f10e6380a'
down_revision: Union[str, Sequence[str], None] = '3c566c1bfb00'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False
        )
    )

    op.add_column(
        "products",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False
        )
    )


def downgrade() -> None:
    op.drop_column("products", "updated_at")
    op.drop_column("products", "created_at")
