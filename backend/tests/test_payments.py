"""Tests for Gravity payment stub service."""

from marina_service.models.enums import PaymentStatus


def test_payment_status_enum_values():
    assert PaymentStatus.UNPAID.value == "UNPAID"
    assert PaymentStatus.PARTIAL.value == "PARTIAL"
    assert PaymentStatus.PAID.value == "PAID"
