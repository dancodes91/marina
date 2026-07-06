"""landing hero text on marinas

Revision ID: 004
Revises: 003
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _column_exists(table: str, column: str) -> bool:
    return column in {col["name"] for col in _insp().get_columns(table)}


def upgrade() -> None:
    if not _column_exists("marinas", "landing_hero_label"):
        op.add_column("marinas", sa.Column("landing_hero_label", sa.String(length=200), nullable=True))
    if not _column_exists("marinas", "landing_hero_title"):
        op.add_column("marinas", sa.Column("landing_hero_title", sa.String(length=500), nullable=True))


def downgrade() -> None:
    if _column_exists("marinas", "landing_hero_title"):
        op.drop_column("marinas", "landing_hero_title")
    if _column_exists("marinas", "landing_hero_label"):
        op.drop_column("marinas", "landing_hero_label")
