import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum as SAEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from marina_service.database import Base
from marina_service.models.enums import FormType, PaymentStatus, RequestStatus


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    marina_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("marinas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    request_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False
    )
    boat_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("boats.id", ondelete="CASCADE"), nullable=False
    )
    form_type: Mapped[FormType] = mapped_column(
        SAEnum(FormType, name="form_type"), nullable=False, default=FormType.GENERAL
    )
    status: Mapped[RequestStatus] = mapped_column(
        SAEnum(RequestStatus, name="request_status"), nullable=False, default=RequestStatus.SUBMITTED
    )
    category: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    custom_description: Mapped[str | None] = mapped_column(Text)
    job_selections: Mapped[list | None] = mapped_column(JSONB, default=list)
    customer_notes: Mapped[str | None] = mapped_column(Text)
    manager_notes: Mapped[str | None] = mapped_column(Text)
    attachments: Mapped[list | None] = mapped_column(JSONB, default=list)
    preferred_date: Mapped[date | None] = mapped_column(Date)
    preferred_time_slot: Mapped[str | None] = mapped_column(String(20))
    wallace_ro_number: Mapped[str | None] = mapped_column(String(20))
    assigned_mechanic_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mechanics.id", ondelete="SET NULL")
    )
    scheduled_date: Mapped[date | None] = mapped_column(Date)
    estimated_completion: Mapped[date | None] = mapped_column(Date)
    total_estimate_list: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    total_estimate_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    invoice_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, name="payment_status"), nullable=False, default=PaymentStatus.UNPAID
    )
    pricing_approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("staff_users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    customer = relationship("Customer", back_populates="service_requests")
    boat = relationship("Boat", back_populates="service_requests")
    labor_lines = relationship("RequestLaborLine", back_populates="request", cascade="all, delete-orphan")
    status_events = relationship(
        "RequestStatusEvent", back_populates="request", cascade="all, delete-orphan"
    )


class RequestStatusEvent(Base):
    __tablename__ = "request_status_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[RequestStatus] = mapped_column(SAEnum(RequestStatus, name="request_status"), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    request = relationship("ServiceRequest", back_populates="status_events")
