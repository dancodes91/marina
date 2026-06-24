import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from marina_service.database import Base
from marina_service.models.enums import RateType


class LaborCode(Base):
    __tablename__ = "labor_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    marina_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("marinas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    labor_code: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    job_first_line: Mapped[str | None] = mapped_column(String(200))
    job_description: Mapped[str | None] = mapped_column(Text)
    job_category: Mapped[str | None] = mapped_column(String(100))
    gl_bill_code: Mapped[str | None] = mapped_column(String(20))
    rate_type: Mapped[RateType] = mapped_column(SAEnum(RateType, name="rate_type"), nullable=False)
    estimate_labor_list: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    estimate_labor_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    estimate_labor_time: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    hourly_rate: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    price_includes_parts: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_load_kit: Mapped[bool] = mapped_column(Boolean, default=False)
    kit_code: Mapped[str | None] = mapped_column(String(50))
    taxable: Mapped[bool] = mapped_column(Boolean, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
