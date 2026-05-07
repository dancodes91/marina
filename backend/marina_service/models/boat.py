import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from marina_service.database import Base


class Boat(Base):
    __tablename__ = "boats"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False
    )
    wallace_stock_id: Mapped[str | None] = mapped_column(String(20), index=True)
    make: Mapped[str | None] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(100))
    year: Mapped[int | None] = mapped_column(Integer)
    loa_ft: Mapped[int | None] = mapped_column(Integer)
    loa_in: Mapped[int | None] = mapped_column(Integer)
    beam_ft: Mapped[int | None] = mapped_column(Integer)
    beam_in: Mapped[int | None] = mapped_column(Integer)
    draft_ft: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    vin_number: Mapped[str | None] = mapped_column(String(50))
    registration: Mapped[str | None] = mapped_column(String(30))
    weight_lbs: Mapped[int | None] = mapped_column(Integer)
    slip_id: Mapped[str | None] = mapped_column(String(20))
    engine_make: Mapped[str | None] = mapped_column(String(100))
    engine_model: Mapped[str | None] = mapped_column(String(100))
    engine_hours: Mapped[Decimal | None] = mapped_column(Numeric(8, 1))
    photos: Mapped[list | None] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    customer = relationship("Customer", back_populates="boats")
    service_requests = relationship("ServiceRequest", back_populates="boat")
