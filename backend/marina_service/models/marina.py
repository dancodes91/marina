import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from marina_service.database import Base


class Marina(Base):
    __tablename__ = "marinas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(20))
    gravity_merchant_id: Mapped[str | None] = mapped_column(String(100))
    gravity_api_key: Mapped[str | None] = mapped_column(String(255))
    sendgrid_template_ids: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    twilio_from_number: Mapped[str | None] = mapped_column(String(20))
    export_watch_dir: Mapped[str | None] = mapped_column(String(500))
    sync_interval_mins: Mapped[int] = mapped_column(Integer, default=15)
    timezone: Mapped[str] = mapped_column(String(50), default="America/New_York")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    availability = relationship("MarinaAvailability", back_populates="marina", uselist=False)


class MarinaAvailability(Base):
    """Marina-scoped slip/storage availability config (seed + Wallace sync)."""

    __tablename__ = "marina_availability"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    marina_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("marinas.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    slips: Mapped[list | None] = mapped_column(JSONB, default=list)
    storage: Mapped[list | None] = mapped_column(JSONB, default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    marina = relationship("Marina", back_populates="availability")
