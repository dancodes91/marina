"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-07

"""

from typing import Sequence, Union

from alembic import op

from marina_service.database import Base
import marina_service.models  # noqa: F401, E402

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
