import enum


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    MANAGER = "MANAGER"
    ADMIN = "ADMIN"


class RequestStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    COMPLETED = "COMPLETED"
    INVOICED = "INVOICED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class FormType(str, enum.Enum):
    WINTER = "WINTER"
    SPRING = "SPRING"
    GENERAL = "GENERAL"


class PaymentStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PARTIAL = "PARTIAL"
    PAID = "PAID"


class RateType(str, enum.Enum):
    HOURLY = "HOURLY"
    FLAT = "FLAT"
    CHARGE_TIME = "CHARGE_TIME"
    FLAT_RATE = "FLAT_RATE"
    QUANTITY = "QUANTITY"


class ReservationType(str, enum.Enum):
    WET_SLIP = "WET_SLIP"
    DRY_RACK = "DRY_RACK"
    INDOOR_STORAGE = "INDOOR_STORAGE"
    OUTDOOR_STORAGE = "OUTDOOR_STORAGE"
    TRAILER = "TRAILER"
    MOORING = "MOORING"


class ReservationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class NotificationChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"


class NotificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    BOUNCED = "BOUNCED"
