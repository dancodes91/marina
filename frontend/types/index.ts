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

export type ServiceRequestSummary = {
  id: string;
  request_number: string;
  status: RequestStatus;
  category: string | null;
  created_at: string;
  preferred_date: string | null;
};

export type ServiceRequestDetail = {
  id: string;
  request_number: string;
  status: RequestStatus;
  category: string | null;
  description: string | null;
  customer_notes: string | null;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  wallace_ro_number: string | null;
  scheduled_date: string | null;
  estimated_completion: string | null;
  total_estimate_list: string | null;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
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
