export type RequestStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "COMPLETED"
  | "INVOICED"
  | "CLOSED"
  | "CANCELLED";

export type FormType = "WINTER" | "SPRING" | "GENERAL";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export type ServiceRequestSummary = {
  id: string;
  request_number: string;
  status: RequestStatus;
  form_type: FormType;
  category: string | null;
  created_at: string;
  preferred_date: string | null;
  payment_status: PaymentStatus;
};

export type ServiceRequestDetail = {
  id: string;
  request_number: string;
  status: RequestStatus;
  form_type: FormType;
  category: string | null;
  description: string | null;
  custom_description: string | null;
  job_selections: string[] | null;
  customer_notes: string | null;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  wallace_ro_number: string | null;
  scheduled_date: string | null;
  estimated_completion: string | null;
  total_estimate_list: string | null;
  invoice_amount: string | null;
  payment_status: PaymentStatus;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
};

export type AvailabilitySlip = {
  size: string;
  length_ft: number | null;
  beam_ft: number | null;
  price_monthly: string | null;
  available: number;
  amenities: string[];
};

export type AvailabilityStorage = {
  type: string;
  name: string;
  max_loa_ft: number | null;
  max_length_ft: number | null;
  price_monthly: string | null;
  available: number;
};

export type PaymentSession = {
  session_id: string;
  checkout_url: string;
  payment_record_id: string;
};

export type PaymentRecord = {
  id: string;
  service_request_id: string | null;
  external_payment_id: string | null;
  amount: string;
  status: string;
  created_at: string;
};

export type Boat = {
  id: string;
  wallace_stock_id: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  loa_ft: number | null;
  loa_in: number | null;
  slip_id: string | null;
  engine_make: string | null;
  engine_model: string | null;
  engine_hours: string | null;
  photos: string[] | null;
};

export type LaborCode = {
  id: string;
  labor_code: string;
  job_first_line: string | null;
  rate_type: string;
  estimate_labor_list: string | null;
  hourly_rate: string | null;
  is_active: boolean;
};

export type LaborLine = {
  id: string;
  labor_code_id: string;
  line_number: number;
  mechanic_id: string | null;
  list_price: string | null;
  labor_charge: string | null;
  job_done: boolean;
};

export type RateType = "HOURLY" | "FLAT" | "CHARGE_TIME" | "FLAT_RATE" | "QUANTITY";

export type LaborCodeInput = {
  labor_code: string;
  job_first_line?: string | null;
  job_description?: string | null;
  job_category?: string | null;
  gl_bill_code?: string | null;
  rate_type: RateType;
  estimate_labor_list?: string | null;
  estimate_labor_cost?: string | null;
  estimate_labor_time?: string | null;
  hourly_rate?: string | null;
  price_includes_parts?: boolean;
  auto_load_kit?: boolean;
  kit_code?: string | null;
  taxable?: boolean;
};

export type ReservationStatus = "PENDING" | "APPROVED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type ReservationType =
  | "WET_SLIP"
  | "DRY_RACK"
  | "INDOOR_STORAGE"
  | "OUTDOOR_STORAGE"
  | "TRAILER"
  | "MOORING";

export type Reservation = {
  id: string;
  request_number: string;
  reservation_type: ReservationType;
  requested_slip_size: string | null;
  start_date: string | null;
  end_date: string | null;
  assigned_slip_id: string | null;
  status: ReservationStatus;
  list_price: string | null;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
};

export type TimelineEvent = {
  status: RequestStatus;
  note: string | null;
  created_at: string;
};

export type NotificationLogEntry = {
  id: string;
  channel: string;
  status: string;
  recipient: string | null;
  subject: string | null;
  error_message: string | null;
  created_at: string;
};

export type SyncStatus = {
  last_sync: string | null;
  status?: string;
  counts: Record<string, number>;
};

export type SyncLog = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  error_message: string | null;
  lines: { level: string; message: string }[];
};

export const REQUEST_STATUSES: RequestStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "IN_PROGRESS",
  "PENDING_APPROVAL",
  "COMPLETED",
  "INVOICED",
  "CLOSED",
  "CANCELLED",
];

export const RESERVATION_STATUSES: ReservationStatus[] = [
  "PENDING",
  "APPROVED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

export const RATE_TYPES: RateType[] = ["HOURLY", "FLAT", "CHARGE_TIME", "FLAT_RATE", "QUANTITY"];
