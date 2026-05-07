import type { RequestStatus } from "@/types";

const colors: Record<RequestStatus, string> = {
  SUBMITTED: "bg-slate-100 text-slate-800",
  UNDER_REVIEW: "bg-amber-100 text-amber-900",
  APPROVED: "bg-emerald-100 text-emerald-900",
  SCHEDULED: "bg-blue-100 text-blue-900",
  IN_PROGRESS: "bg-indigo-100 text-indigo-900",
  PENDING_APPROVAL: "bg-orange-100 text-orange-900",
  COMPLETED: "bg-teal-100 text-teal-900",
  INVOICED: "bg-cyan-100 text-cyan-900",
  CLOSED: "bg-slate-200 text-slate-800",
  CANCELLED: "bg-red-100 text-red-900",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
