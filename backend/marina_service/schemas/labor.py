from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from marina_service.models.enums import RateType


class LaborCodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    labor_code: str
    job_first_line: str | None
    job_description: str | None
    job_category: str | None
    gl_bill_code: str | None
    rate_type: RateType
    estimate_labor_list: Decimal | None
    estimate_labor_cost: Decimal | None
    estimate_labor_time: Decimal | None
    hourly_rate: Decimal | None
    price_includes_parts: bool
    auto_load_kit: bool
    kit_code: str | None
    taxable: bool
    is_active: bool


class LaborCodeCreate(BaseModel):
    labor_code: str
    job_first_line: str | None = None
    job_description: str | None = None
    job_category: str | None = None
    gl_bill_code: str | None = None
    rate_type: RateType
    estimate_labor_list: Decimal | None = None
    estimate_labor_cost: Decimal | None = None
    estimate_labor_time: Decimal | None = None
    hourly_rate: Decimal | None = None
    price_includes_parts: bool = False
    auto_load_kit: bool = False
    kit_code: str | None = None
    taxable: bool = True


class LaborCodePatch(BaseModel):
    job_first_line: str | None = None
    job_description: str | None = None
    job_category: str | None = None
    gl_bill_code: str | None = None
    rate_type: RateType | None = None
    estimate_labor_list: Decimal | None = None
    estimate_labor_cost: Decimal | None = None
    estimate_labor_time: Decimal | None = None
    hourly_rate: Decimal | None = None
    price_includes_parts: bool | None = None
    auto_load_kit: bool | None = None
    kit_code: str | None = None
    taxable: bool | None = None
    is_active: bool | None = None


class LaborLineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    request_id: UUID
    labor_code_id: UUID
    line_number: int
    mechanic_id: UUID | None
    estimate_hours: Decimal | None
    actual_time_worked: Decimal | None
    charge_time: Decimal | None
    hourly_rate_override: Decimal | None
    flat_rate_override: Decimal | None
    labor_charge: Decimal | None
    list_price: Decimal | None
    taxable_override: bool | None
    job_done: bool
    manager_notes: str | None


class LaborLineCreate(BaseModel):
    labor_code_id: UUID
    line_number: int | None = None
    mechanic_id: UUID | None = None
    estimate_hours: Decimal | None = None
    actual_time_worked: Decimal | None = None
    charge_time: Decimal | None = None
    hourly_rate_override: Decimal | None = None
    flat_rate_override: Decimal | None = None
    taxable_override: bool | None = None
    manager_notes: str | None = None


class LaborLinePatch(BaseModel):
    line_number: int | None = None
    mechanic_id: UUID | None = None
    estimate_hours: Decimal | None = None
    actual_time_worked: Decimal | None = None
    charge_time: Decimal | None = None
    hourly_rate_override: Decimal | None = None
    flat_rate_override: Decimal | None = None
    taxable_override: bool | None = None
    job_done: bool | None = None
    manager_notes: str | None = None


class EstimateOut(BaseModel):
    total_estimate_list: Decimal | None
    total_estimate_cost: Decimal | None
    lines: list[LaborLineOut]
