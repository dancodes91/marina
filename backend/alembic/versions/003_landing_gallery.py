"""landing gallery images

Revision ID: 003
Revises: 002
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insp():
    return sa.inspect(op.get_bind())


def _table_exists(name: str) -> bool:
    return name in _insp().get_table_names()


def upgrade() -> None:
    if _table_exists("landing_gallery_images"):
        return

    op.create_table(
        "landing_gallery_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("marina_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("s3_key", sa.String(length=500), nullable=False),
        sa.Column("public_url", sa.String(length=1000), nullable=False),
        sa.Column("alt_text", sa.String(length=300), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["marina_id"], ["marinas.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_landing_gallery_images_marina_id", "landing_gallery_images", ["marina_id"])


def downgrade() -> None:
    if not _table_exists("landing_gallery_images"):
        return
    op.drop_index("ix_landing_gallery_images_marina_id", table_name="landing_gallery_images")
    op.drop_table("landing_gallery_images")
