"""Async notification dispatch via Celery (sync DB session inside worker)."""

from __future__ import annotations

import uuid

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from marina_service.config import get_settings
from marina_service.models.customer import Customer
from marina_service.models.enums import RequestStatus
from marina_service.models.service_request import ServiceRequest
from marina_service.services import notifications as notif_service
from marina_service.tasks.celery_app import celery_app


def _sync_session():
    settings = get_settings()
    engine = create_engine(settings.database_url_sync, pool_pre_ping=True)
    return sessionmaker(bind=engine)()


@celery_app.task(bind=True, max_retries=3)
def notify_request_status_changed(self, request_id: str, new_status: str) -> None:
    try:
        session = _sync_session()
        try:
            req = session.get(ServiceRequest, uuid.UUID(request_id))
            if not req:
                return
            cust = session.get(Customer, req.customer_id)
            if not cust:
                return
            status_enum = RequestStatus(new_status)
            sr = req.request_number
            body_customer = _customer_message(status_enum, sr)
            if cust.email and cust.email_opt_in:
                notif_service.send_email_sync(
                    session,
                    to_email=cust.email,
                    subject=f"Service request {sr} update",
                    body_text=body_customer,
                    customer_id=cust.id,
                    service_request_id=req.id,
                    template_key=f"status_{new_status}",
                )
            # INVOICED and CLOSED: email only per spec
            sms_ok = status_enum not in (RequestStatus.INVOICED, RequestStatus.CLOSED)
            if cust.phone and cust.sms_opt_in and sms_ok:
                notif_service.send_sms_sync(
                    session,
                    to_phone=cust.phone,
                    body=body_customer[:1400],
                    customer_id=cust.id,
                    service_request_id=req.id,
                    template_key=f"status_{new_status}",
                )
            # Manager email on SUBMITTED
            if status_enum == RequestStatus.SUBMITTED:
                for em in notif_service.manager_alert_emails():
                    notif_service.send_email_sync(
                        session,
                        to_email=em,
                        subject=f"New service request {sr}",
                        body_text=f"New service request {sr} submitted.",
                        service_request_id=req.id,
                        template_key="manager_new_request",
                    )
            session.commit()
        finally:
            session.close()
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2**self.request.retries))


def _customer_message(status: RequestStatus, sr: str) -> str:
    messages = {
        RequestStatus.SUBMITTED: f"{sr} received. We'll review and contact you shortly.",
        RequestStatus.UNDER_REVIEW: f"Your request {sr} is being reviewed by our service team.",
        RequestStatus.APPROVED: f"Great news! {sr} has been approved. We'll confirm your schedule soon.",
        RequestStatus.SCHEDULED: f"{sr} has been scheduled. Please ensure boat access is available.",
        RequestStatus.IN_PROGRESS: f"Work has begun on {sr}. We'll notify you when complete.",
        RequestStatus.PENDING_APPROVAL: f"Additional work found on {sr}. Please call us to approve.",
        RequestStatus.COMPLETED: f"{sr} is complete! Contact us to arrange pickup.",
        RequestStatus.INVOICED: f"Invoice for {sr} is ready.",
        RequestStatus.CLOSED: f"Thank you - {sr} is closed. See you next season!",
        RequestStatus.CANCELLED: f"{sr} has been cancelled. Contact us with any questions.",
    }
    return messages.get(status, f"Update for {sr}.")
