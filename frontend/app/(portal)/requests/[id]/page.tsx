"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RequestTimeline, type TimelineEvent } from "@/components/requests/RequestTimeline";
import { StatusBadge } from "@/components/requests/StatusBadge";
import { apiFetch } from "@/lib/api";
import type { RequestStatus, ServiceRequestDetail } from "@/types";

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [req, setReq] = useState<ServiceRequestDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ServiceRequestDetail>(`/api/v1/requests/${id}`)
      .then(setReq)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
    apiFetch<TimelineEvent[]>(`/api/v1/requests/${id}/timeline`)
      .then(setTimeline)
      .catch(() => {});
  }, [id]);

  async function cancel() {
    if (!confirm("Cancel this request?")) return;
    try {
      await apiFetch(`/api/v1/requests/${id}/cancel`, { method: "POST" });
      router.refresh();
      const r = await apiFetch<ServiceRequestDetail>(`/api/v1/requests/${id}`);
      setReq(r);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Cancel failed");
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!req) return <p className="text-slate-600">Loading…</p>;

  const canCancel = req.status === "SUBMITTED" || req.status === "UNDER_REVIEW";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">
            ← Back
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{req.request_number}</h1>
          <div className="mt-2">
            <StatusBadge status={req.status as RequestStatus} />
          </div>
        </div>
        {canCancel && (
          <button
            type="button"
            onClick={cancel}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-800 hover:bg-red-50"
          >
            Cancel request
          </button>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-medium text-slate-900">Details</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Description</dt>
              <dd className="text-slate-900">{req.description || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Preferred</dt>
              <dd className="text-slate-900">
                {req.preferred_date || "—"} {req.preferred_time_slot ? `(${req.preferred_time_slot})` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Estimated total</dt>
              <dd className="text-slate-900">
                {req.total_estimate_list != null ? `$${req.total_estimate_list}` : "—"}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-medium text-slate-900">Timeline</h2>
          <RequestTimeline events={timeline} />
        </div>
      </div>
    </div>
  );
}
