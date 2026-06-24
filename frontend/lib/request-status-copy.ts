import type { RequestStatus } from "@/types";

export const STATUS_COPY: Record<
  RequestStatus,
  { title: string; description: string }
> = {
  SUBMITTED: {
    title: "Request received",
    description: "Your work order has been submitted. Our service team will review it shortly.",
  },
  UNDER_REVIEW: {
    title: "Under review",
    description: "A service manager is reviewing your request and preparing an estimate.",
  },
  APPROVED: {
    title: "Approved",
    description: "Your request has been approved. We will contact you to schedule service.",
  },
  SCHEDULED: {
    title: "Scheduled",
    description: "Your boat is on the schedule. Check the dates below for arrival and completion.",
  },
  IN_PROGRESS: {
    title: "Work in progress",
    description: "Our technicians are actively working on your boat.",
  },
  PENDING_APPROVAL: {
    title: "Awaiting your approval",
    description: "Additional work was identified. Please review the updated estimate.",
  },
  COMPLETED: {
    title: "Work completed",
    description: "Service is complete. Your boat is ready for pickup or launch.",
  },
  INVOICED: {
    title: "Invoice ready",
    description: "Your invoice is ready. Pay online to close out this work order.",
  },
  CLOSED: {
    title: "Closed",
    description: "This work order is complete and paid. Thank you for choosing us.",
  },
  CANCELLED: {
    title: "Cancelled",
    description: "This request was cancelled. Contact the marina if you need to reopen it.",
  },
};

export function getStatusCopy(status: RequestStatus) {
  return STATUS_COPY[status] ?? STATUS_COPY.SUBMITTED;
}
