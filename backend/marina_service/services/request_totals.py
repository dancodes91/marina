from decimal import Decimal
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.models.boat import Boat
from marina_service.models.labor_code import LaborCode
from marina_service.models.request_labor_line import RequestLaborLine
from marina_service.models.service_request import ServiceRequest
from marina_service.services.pricing import calculate_labor_charge, calculate_list_price


async def recalculate_request_totals(db: AsyncSession, request_id: uuid.UUID) -> None:
    r = await db.get(ServiceRequest, request_id)
    if not r:
        return
    boat = await db.get(Boat, r.boat_id)
    if not boat:
        return
    res = await db.execute(select(RequestLaborLine).where(RequestLaborLine.request_id == request_id))
    lines = res.scalars().all()
    total_list = Decimal("0")
    total_cost = Decimal("0")
    for line in lines:
        code = await db.get(LaborCode, line.labor_code_id)
        if not code:
            continue
        charge = calculate_labor_charge(line, code, boat)
        list_p = calculate_list_price(line, code, boat)
        line.labor_charge = charge
        line.list_price = list_p
        total_list += list_p
        total_cost += code.estimate_labor_cost or Decimal("0")
    r.total_estimate_list = total_list
    r.total_estimate_cost = total_cost
