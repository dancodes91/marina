"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/requests/StatusBadge";
import { apiFetch } from "@/lib/api";
import type { RequestStatus, ServiceRequestSummary } from "@/types";

export default function ManagerRequestsPage() {
  const [rows, setRows] = useState<ServiceRequestSummary[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = filter ? `?status=${encodeURIComponent(filter)}` : "";
    apiFetch<ServiceRequestSummary[]>(`/api/v1/manager/requests${q}`)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [filter]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Service requests</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {(
            [
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
            ] as RequestStatus[]
          ).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2">Number</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link className="font-medium text-blue-700 hover:underline" href={`/manager/requests/${r.id}`}>
                    {r.request_number}
                  </Link>
                </td>
                <td className="px-4 py-2">{r.category || "—"}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-2 text-slate-600">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-8 text-center text-slate-600">No requests.</p>}
      </div>
    </div>
  );
}

