from decimal import Decimal

from marina_service.models.boat import Boat
from marina_service.models.enums import RateType
from marina_service.models.labor_code import LaborCode
from marina_service.models.request_labor_line import RequestLaborLine


def boat_loa_decimal(boat: Boat) -> Decimal:
    ft = Decimal(str(boat.loa_ft or 0))
    inch = Decimal(str(boat.loa_in or 0))
    return ft + inch / Decimal("12")


def calculate_labor_charge(line: RequestLaborLine, code: LaborCode, boat: Boat) -> Decimal:
    """Mirror spec Section 5.2 pricing logic."""
    match code.rate_type:
        case RateType.HOURLY:
            rate = line.hourly_rate_override or code.hourly_rate or Decimal("0")
            return Decimal(str(line.actual_time_worked or 0)) * rate
        case RateType.FLAT:
            if line.flat_rate_override is not None:
                return line.flat_rate_override
            return code.estimate_labor_list or Decimal("0")
        case RateType.CHARGE_TIME:
            rate = line.hourly_rate_override or code.hourly_rate or Decimal("0")
            return Decimal(str(line.charge_time or 0)) * rate
        case RateType.FLAT_RATE:
            if line.flat_rate_override is not None:
                return line.flat_rate_override
            return code.estimate_labor_list or Decimal("0")
        case RateType.QUANTITY:
            loa = boat_loa_decimal(boat)
            unit_price = line.flat_rate_override or code.estimate_labor_list or Decimal("0")
            return loa * unit_price
        case _:
            return Decimal("0")


def calculate_list_price(line: RequestLaborLine, code: LaborCode, boat: Boat) -> Decimal:
    """Customer-facing list price for line (for totals); mirrors charge logic using list where applicable."""
    # For manager estimates, list_price often tracks retail/list side from Wallace.
    match code.rate_type:
        case RateType.HOURLY:
            rate = line.hourly_rate_override or code.hourly_rate or Decimal("0")
            # Use charge_time if set else actual for list preview
            t = line.charge_time if line.charge_time is not None else line.actual_time_worked
            return Decimal(str(t or 0)) * rate
        case RateType.FLAT | RateType.FLAT_RATE:
            return line.flat_rate_override or code.estimate_labor_list or Decimal("0")
        case RateType.CHARGE_TIME:
            rate = line.hourly_rate_override or code.hourly_rate or Decimal("0")
            return Decimal(str(line.charge_time or 0)) * rate
        case RateType.QUANTITY:
            loa = boat_loa_decimal(boat)
            unit = line.flat_rate_override or code.estimate_labor_list or Decimal("0")
            return loa * unit
        case _:
            return Decimal("0")
