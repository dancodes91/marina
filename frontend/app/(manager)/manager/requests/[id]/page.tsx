"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/requests/StatusBadge";
import { LaborLineEditor } from "@/components/requests/LaborLineEditor";
import { apiFetch } from "@/lib/api";
import type { LaborCode, LaborLine, RequestStatus } from "@/types";

type ManagerReq = {
  id: string;
  request_number: string;
  status: RequestStatus;
  manager_notes: string | null;
  wallace_ro_number: string | null;
  total_estimate_list: string | null;
  total_estimate_cost: string | null;
};

export default function ManagerRequestDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [req, setReq] = useState<ManagerReq | null>(null);
  const [lines, setLines] = useState<LaborLine[]>([]);
  const [codes, setCodes] = useState<LaborCode[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<RequestStatus>("SUBMITTED");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await apiFetch<ManagerReq>(`/api/v1/manager/requests/${id}`);
    setReq(r);
    setNotes(r.manager_notes || "");
    setStatus(r.status);
    const l = await apiFetch<LaborLine[]>(`/api/v1/manager/requests/${id}/labor`);
    setLines(l);
  }, [id]);

  useEffect(() => {
    apiFetch<LaborCode[]>("/api/v1/labor-codes?q=")
      .then(setCodes)
      .catch(() => {});
    load().catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [load]);

  async function saveNotes() {
    await apiFetch(`/api/v1/manager/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ manager_notes: notes }),
    });
    await load();
  }

  async function changeStatus() {
    await apiFetch(`/api/v1/manager/requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!req) return <p className="text-slate-600">Loading…</p>;

  return (
    <div>
      <Link href="/manager/requests" className="text-sm text-blue-700 hover:underline">
        ← Queue
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{req.request_number}</h1>
          <StatusBadge status={req.status} />
        </div>
        <div className="text-right text-sm text-slate-600">
          <div>List: {req.total_estimate_list != null ? `$${req.total_estimate_list}` : "—"}</div>
          <div>Cost: {req.total_estimate_cost != null ? `$${req.total_estimate_cost}` : "—"}</div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-medium">Status</h2>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as RequestStatus)}
            >
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
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={changeStatus}
              className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white hover:bg-slate-800"
            >
              Update status
            </button>
          </div>
          <div className="mt-4">
            <label className="text-sm text-slate-600">Manager notes</label>
            <textarea
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              type="button"
              onClick={saveNotes}
              className="mt-2 rounded-md bg-blue-700 px-3 py-1 text-sm text-white"
            >
              Save notes
            </button>
          </div>
        </div>
        <LaborLineEditor requestId={id} lines={lines} codes={codes} onChanged={load} />
      </div>
    </div>
  );
}

