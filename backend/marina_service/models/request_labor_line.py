import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from marina_service.database import Base


class RequestLaborLine(Base):
    __tablename__ = "request_labor_lines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False
    )
    labor_code_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("labor_codes.id", ondelete="RESTRICT"), nullable=False
    )
    line_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    mechanic_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mechanics.id", ondelete="SET NULL")
    )
    estimate_hours: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    actual_time_worked: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    charge_time: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    hourly_rate_override: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    flat_rate_override: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    labor_charge: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    list_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    taxable_override: Mapped[bool | None] = mapped_column(Boolean)
    job_done: Mapped[bool] = mapped_column(Boolean, default=False)
    manager_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    request = relationship("ServiceRequest", back_populates="labor_lines")
    labor_code = relationship("LaborCode")
    mechanic = relationship("Mechanic")
