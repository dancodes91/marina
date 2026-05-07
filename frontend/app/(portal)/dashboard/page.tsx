"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ServiceRequestSummary } from "@/types";
import { StatusBadge } from "@/components/requests/StatusBadge";

export default function DashboardPage() {
  const [rows, setRows] = useState<ServiceRequestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ServiceRequestSummary[]>("/api/v1/requests")
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Your requests</h1>
        <Link
          href="/requests/new"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          New request
        </Link>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 && !error && (
          <li className="px-4 py-8 text-center text-slate-600">No service requests yet.</li>
        )}
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/requests/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50">
              <div>
                <span className="font-medium text-slate-900">{r.request_number}</span>
                <span className="ml-2 text-sm text-slate-500">{r.category || "General"}</span>
              </div>
              <StatusBadge status={r.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
