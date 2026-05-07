import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from marina_service.config import get_settings
from marina_service.models.enums import NotificationStatus
from marina_service.models.notification_log import NotificationLog


def log_notification(
    session: Session,
    *,
    channel: str,
    status: str,
    recipient: str,
    customer_id: uuid.UUID | None = None,
    service_request_id: uuid.UUID | None = None,
    template_key: str | None = None,
    subject: str | None = None,
    body_preview: str | None = None,
    error_message: str | None = None,
) -> NotificationLog:
    row = NotificationLog(
        customer_id=customer_id,
        channel=channel,
        status=status,
        template_key=template_key,
        recipient=recipient,
        subject=subject,
        body_preview=body_preview,
        error_message=error_message,
        service_request_id=service_request_id,
    )
    session.add(row)
    session.flush()
    return row


def send_email_sync(
    session: Session,
    *,
    to_email: str,
    subject: str,
    body_text: str,
    customer_id: uuid.UUID | None = None,
    service_request_id: uuid.UUID | None = None,
    template_key: str | None = None,
) -> NotificationLog:
    settings = get_settings()
    if not settings.sendgrid_api_key:
        return log_notification(
            session,
            channel="EMAIL",
            status=NotificationStatus.FAILED.value,
            recipient=to_email,
            customer_id=customer_id,
            service_request_id=service_request_id,
            template_key=template_key,
            subject=subject,
            body_preview=body_text[:500],
            error_message="SendGrid not configured",
        )
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)
        m = Mail(
            from_email=settings.sendgrid_from_email,
            to_emails=to_email,
            subject=subject,
            plain_text_content=body_text,
        )
        sg.send(m)
        return log_notification(
            session,
            channel="EMAIL",
            status=NotificationStatus.SENT.value,
            recipient=to_email,
            customer_id=customer_id,
            service_request_id=service_request_id,
            template_key=template_key,
            subject=subject,
            body_preview=body_text[:500],
        )
    except Exception as e:
        return log_notification(
            session,
            channel="EMAIL",
            status=NotificationStatus.FAILED.value,
            recipient=to_email,
            customer_id=customer_id,
            service_request_id=service_request_id,
            template_key=template_key,
            subject=subject,
            body_preview=body_text[:500],
            error_message=str(e),
        )


def send_sms_sync(
    session: Session,
    *,
    to_phone: str,
    body: str,
    customer_id: uuid.UUID | None = None,
    service_request_id: uuid.UUID | None = None,
    template_key: str | None = None,
) -> NotificationLog:
    settings = get_settings()
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        return log_notification(
            session,
            channel="SMS",
            status=NotificationStatus.FAILED.value,
            recipient=to_phone,
            customer_id=customer_id,
            service_request_id=service_request_id,
            template_key=template_key,
            body_preview=body[:500],
            error_message="Twilio not configured",
        )
    try:
        from twilio.rest import Client

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        if settings.twilio_messaging_service_sid:
            client.messages.create(
                messaging_service_sid=settings.twilio_messaging_service_sid,
                body=body,
                to=to_phone,
            )
        else:
            return log_notification(
                session,
                channel="SMS",
                status=NotificationStatus.FAILED.value,
                recipient=to_phone,
                customer_id=customer_id,
                service_request_id=service_request_id,
                template_key=template_key,
                body_preview=body[:500],
                error_message="TWILIO_MESSAGING_SERVICE_SID not set",
            )
        return log_notification(
            session,
            channel="SMS",
            status=NotificationStatus.SENT.value,
            recipient=to_phone,
            customer_id=customer_id,
            service_request_id=service_request_id,
            template_key=template_key,
            body_preview=body[:500],
        )
    except Exception as e:
        return log_notification(
            session,
            channel="SMS",
            status=NotificationStatus.FAILED.value,
            recipient=to_phone,
            customer_id=customer_id,
            service_request_id=service_request_id,
            template_key=template_key,
            body_preview=body[:500],
            error_message=str(e),
        )


def manager_alert_emails() -> list[str]:
    raw = get_settings().manager_alert_emails or ""
    if raw.strip():
        return [e.strip() for e in raw.split(",") if e.strip()]
    return []
