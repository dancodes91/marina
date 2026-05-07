from decimal import Decimal
import uuid

from marina_service.models.boat import Boat
from marina_service.models.enums import RateType
from marina_service.models.labor_code import LaborCode
from marina_service.models.request_labor_line import RequestLaborLine
from marina_service.services.pricing import calculate_labor_charge, calculate_list_price


def _boat(loa_ft: int = 10, loa_in: int = 0) -> Boat:
    return Boat(
        id=uuid.uuid4(),
        customer_id=uuid.uuid4(),
        loa_ft=loa_ft,
        loa_in=loa_in,
    )


def _code(rt: RateType, **kwargs) -> LaborCode:
    base = dict(
        id=uuid.uuid4(),
        labor_code="T",
        rate_type=rt,
        estimate_labor_list=Decimal("100"),
        estimate_labor_cost=Decimal("50"),
        hourly_rate=Decimal("50"),
        price_includes_parts=False,
        auto_load_kit=False,
        taxable=True,
        is_active=True,
    )
    base.update(kwargs)
    return LaborCode(**base)


def test_hourly_charge():
    boat = _boat()
    code = _code(RateType.HOURLY)
    line = RequestLaborLine(
        id=uuid.uuid4(),
        request_id=uuid.uuid4(),
        labor_code_id=code.id,
        line_number=1,
        actual_time_worked=Decimal("2"),
        charge_time=None,
    )
    assert calculate_labor_charge(line, code, boat) == Decimal("100")


def test_flat_charge():
    boat = _boat()
    code = _code(RateType.FLAT, estimate_labor_list=Decimal("75"))
    line = RequestLaborLine(
        id=uuid.uuid4(),
        request_id=uuid.uuid4(),
        labor_code_id=code.id,
        line_number=1,
    )
    assert calculate_labor_charge(line, code, boat) == Decimal("75")


def test_quantity_uses_loa():
    boat = _boat(loa_ft=10, loa_in=6)  # 10.5 ft
    code = _code(RateType.QUANTITY, estimate_labor_list=Decimal("10"))
    line = RequestLaborLine(
        id=uuid.uuid4(),
        request_id=uuid.uuid4(),
        labor_code_id=code.id,
        line_number=1,
    )
    assert calculate_labor_charge(line, code, boat) == Decimal("105")
