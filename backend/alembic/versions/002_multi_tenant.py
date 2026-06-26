"""multi-tenant schema + v2 fields

Revision ID: 002
Revises: 001
"""

from typing import Sequence, Union

import os

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_MARINA_ID = "00000000-0000-4000-8000-000000000001"
DEFAULT_MARINA_NAME = os.environ.get("DEFAULT_MARINA_NAME", "Your Dealership Name")
DEFAULT_MARINA_SLUG = os.environ.get("DEFAULT_MARINA_SLUG", "your-dealership-name")
DEFAULT_MARINA_CONTACT_EMAIL = os.environ.get("DEFAULT_MARINA_CONTACT_EMAIL", "service@example.com")
DEFAULT_MARINA_CONTACT_PHONE = os.environ.get("DEFAULT_MARINA_CONTACT_PHONE", "(410) 555-0100")


def _insp():
    return sa.inspect(op.get_bind())


def _table_exists(name: str) -> bool:
    return name in _insp().get_table_names()


def _column_exists(table: str, column: str) -> bool:
    if not _table_exists(table):
        return False
    return column in {c["name"] for c in _insp().get_columns(table)}


def _unique_constraint_exists(table: str, name: str) -> bool:
    if not _table_exists(table):
        return False
    return any(uc.get("name") == name for uc in _insp().get_unique_constraints(table))


def _index_exists(table: str, name: str) -> bool:
    if not _table_exists(table):
        return False
    return any(ix.get("name") == name for ix in _insp().get_indexes(table))


def _fk_exists(table: str, name: str) -> bool:
    if not _table_exists(table):
        return False
    return any(fk.get("name") == name for fk in _insp().get_foreign_keys(table))


def _enum_exists(name: str) -> bool:
    conn = op.get_bind()
    r = conn.execute(
        sa.text("SELECT 1 FROM pg_type WHERE typname = :n"),
        {"n": name},
    )
    return r.scalar() is not None


def _create_enum_if_missing(name: str, values: str) -> None:
    if _enum_exists(name):
        return
    op.execute(f"CREATE TYPE {name} AS ENUM ({values})")


def _is_fully_migrated() -> bool:
    return _table_exists("marinas") and _column_exists("customers", "marina_id")


def upgrade() -> None:
    if _is_fully_migrated():
        return

    # Fresh database (no 001 tables yet)
    if not _table_exists("customers"):
        from marina_service.database import Base
        import marina_service.models  # noqa: F401

        Base.metadata.create_all(bind=op.get_bind())
        if _table_exists("marinas"):
            op.get_bind().execute(
                sa.text(
                    """
                    INSERT INTO marinas (id, name, slug, contact_email, contact_phone, is_active)
                    VALUES (:id, :name, :slug, :email, :phone, true)
                    ON CONFLICT (slug) DO NOTHING
                    """
                ),
                {
                    "id": DEFAULT_MARINA_ID,
                    "name": DEFAULT_MARINA_NAME,
                    "slug": DEFAULT_MARINA_SLUG,
                    "email": DEFAULT_MARINA_CONTACT_EMAIL,
                    "phone": DEFAULT_MARINA_CONTACT_PHONE,
                },
            )
        return

    # Upgrade existing 001 schema
    _create_enum_if_missing("form_type", "'WINTER', 'SPRING', 'GENERAL'")
    _create_enum_if_missing("payment_status", "'UNPAID', 'PARTIAL', 'PAID'")
    _create_enum_if_missing(
        "reservation_type",
        "'WET_SLIP', 'DRY_RACK', 'INDOOR_STORAGE', 'OUTDOOR_STORAGE', 'TRAILER', 'MOORING'",
    )
    _create_enum_if_missing(
        "reservation_status",
        "'PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'",
    )

    if not _table_exists("marinas"):
        op.create_table(
            "marinas",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("slug", sa.String(50), nullable=False),
            sa.Column("contact_email", sa.String(255)),
            sa.Column("contact_phone", sa.String(20)),
            sa.Column("gravity_merchant_id", sa.String(100)),
            sa.Column("gravity_api_key", sa.String(255)),
            sa.Column("sendgrid_template_ids", postgresql.JSONB),
            sa.Column("twilio_from_number", sa.String(20)),
            sa.Column("export_watch_dir", sa.String(500)),
            sa.Column("sync_interval_mins", sa.Integer(), server_default="15"),
            sa.Column("timezone", sa.String(50), server_default="America/New_York"),
            sa.Column("is_active", sa.Boolean(), server_default="true"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        )
        if not _index_exists("marinas", "ix_marinas_slug"):
            op.create_index("ix_marinas_slug", "marinas", ["slug"], unique=True)

    op.get_bind().execute(
        sa.text(
            """
            INSERT INTO marinas (id, name, slug, contact_email, contact_phone, is_active)
            VALUES (:id, :name, :slug, :email, :phone, true)
            ON CONFLICT (slug) DO NOTHING
            """
        ),
        {
            "id": DEFAULT_MARINA_ID,
            "name": DEFAULT_MARINA_NAME,
            "slug": DEFAULT_MARINA_SLUG,
            "email": DEFAULT_MARINA_CONTACT_EMAIL,
            "phone": DEFAULT_MARINA_CONTACT_PHONE,
        },
    )

    if not _table_exists("marina_availability"):
        op.create_table(
            "marina_availability",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "marina_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("marinas.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("slips", postgresql.JSONB),
            sa.Column("storage", postgresql.JSONB),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.UniqueConstraint("marina_id"),
        )

    op.get_bind().execute(
        sa.text(
            """
            INSERT INTO marina_availability (id, marina_id, slips, storage)
            SELECT gen_random_uuid(), :mid, '[]'::jsonb, '[]'::jsonb
            WHERE NOT EXISTS (
                SELECT 1 FROM marina_availability WHERE marina_id = :mid
            )
            """
        ),
        {"mid": DEFAULT_MARINA_ID},
    )

    for table in ("customers", "boats", "service_requests", "labor_codes", "mechanics", "staff_users"):
        if not _column_exists(table, "marina_id"):
            op.add_column(table, sa.Column("marina_id", postgresql.UUID(as_uuid=True), nullable=True))
            op.get_bind().execute(
                sa.text(f"UPDATE {table} SET marina_id = :mid WHERE marina_id IS NULL"),
                {"mid": DEFAULT_MARINA_ID},
            )
            op.alter_column(table, "marina_id", nullable=False)
            fk_name = f"fk_{table}_marina_id"
            if not _fk_exists(table, fk_name):
                op.create_foreign_key(fk_name, table, "marinas", ["marina_id"], ["id"], ondelete="CASCADE")
            idx_name = f"ix_{table}_marina_id"
            if not _index_exists(table, idx_name):
                op.create_index(idx_name, table, ["marina_id"])

    if not _column_exists("customers", "street"):
        op.add_column("customers", sa.Column("street", sa.String(200)))
        op.add_column("customers", sa.Column("city", sa.String(100)))
        op.add_column("customers", sa.Column("state", sa.String(2)))
        op.add_column("customers", sa.Column("zip_code", sa.String(10)))

    if not _column_exists("boats", "storage_location"):
        op.add_column("boats", sa.Column("storage_location", sa.String(50)))
        op.add_column("boats", sa.Column("notes", sa.Text()))

    if not _column_exists("service_requests", "form_type"):
        op.add_column(
            "service_requests",
            sa.Column(
                "form_type",
                postgresql.ENUM("WINTER", "SPRING", "GENERAL", name="form_type", create_type=False),
                server_default="GENERAL",
                nullable=False,
            ),
        )
        op.add_column("service_requests", sa.Column("custom_description", sa.Text()))
        op.add_column("service_requests", sa.Column("job_selections", postgresql.JSONB, server_default="[]"))
        op.add_column("service_requests", sa.Column("invoice_amount", sa.Numeric(10, 2)))
        op.add_column(
            "service_requests",
            sa.Column(
                "payment_status",
                postgresql.ENUM("UNPAID", "PARTIAL", "PAID", name="payment_status", create_type=False),
                server_default="UNPAID",
                nullable=False,
            ),
        )

    if _unique_constraint_exists("staff_users", "staff_users_email_key"):
        op.drop_constraint("staff_users_email_key", "staff_users", type_="unique")

    if _column_exists("staff_users", "marina_id") and not _index_exists(
        "staff_users", "ix_staff_users_marina_email"
    ):
        op.create_index("ix_staff_users_marina_email", "staff_users", ["marina_id", "email"], unique=True)

    if not _table_exists("reservations"):
        op.create_table(
            "reservations",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("request_number", sa.String(20), nullable=False),
            sa.Column(
                "marina_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("marinas.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "customer_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("customers.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "boat_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("boats.id", ondelete="SET NULL"),
            ),
            sa.Column(
                "reservation_type",
                postgresql.ENUM(name="reservation_type", create_type=False),
                nullable=False,
            ),
            sa.Column("requested_slip_size", sa.String(20)),
            sa.Column("start_date", sa.Date()),
            sa.Column("end_date", sa.Date()),
            sa.Column("assigned_slip_id", sa.String(20)),
            sa.Column(
                "status",
                postgresql.ENUM(name="reservation_status", create_type=False),
                server_default="PENDING",
                nullable=False,
            ),
            sa.Column("list_price", sa.Numeric(10, 2)),
            sa.Column(
                "payment_status",
                postgresql.ENUM(name="payment_status", create_type=False),
                server_default="UNPAID",
                nullable=False,
            ),
            sa.Column("contract_date", sa.Date()),
            sa.Column("notes", sa.Text()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        )
        op.create_index("ix_reservations_request_number", "reservations", ["request_number"], unique=True)

    if not _table_exists("payment_records"):
        op.create_table(
            "payment_records",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "marina_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("marinas.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "customer_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("customers.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "service_request_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("service_requests.id", ondelete="SET NULL"),
            ),
            sa.Column("external_payment_id", sa.String(100)),
            sa.Column("amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("status", sa.String(20), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        )


def downgrade() -> None:
    pass
