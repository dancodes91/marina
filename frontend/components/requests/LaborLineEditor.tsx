"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { LaborCode, LaborLine } from "@/types";

export function LaborLineEditor({
  requestId,
  lines,
  codes,
  onChanged,
}: {
  requestId: string;
  lines: LaborLine[];
  codes: LaborCode[];
  onChanged: () => void;
}) {
  const [laborId, setLaborId] = useState(codes[0]?.id || "");

  useEffect(() => {
    if (codes.length && !laborId) setLaborId(codes[0].id);
  }, [codes, laborId]);

  async function addLine() {
    if (!laborId) return;
    await apiFetch(`/api/v1/manager/requests/${requestId}/labor`, {
      method: "POST",
      body: JSON.stringify({ labor_code_id: laborId }),
    });
    onChanged();
  }

  async function removeLine(lineId: string) {
    if (!confirm("Remove this line?")) return;
    await apiFetch(`/api/v1/manager/requests/${requestId}/labor/${lineId}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div>
      <h2 className="mb-3 font-medium text-primary">Labor lines</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 px-2 py-1 text-sm"
          value={laborId}
          onChange={(e) => setLaborId(e.target.value)}
        >
          {codes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.labor_code} — {c.job_first_line || c.rate_type}
            </option>
          ))}
        </select>
        <button type="button" onClick={addLine} className="rounded-md bg-blue-700 px-3 py-1 text-sm text-white">
          Add line
        </button>
      </div>
      <ul className="divide-y divide-slate-100 text-sm">
        {lines.map((ln) => {
          const code = codes.find((c) => c.id === ln.labor_code_id);
          return (
            <li key={ln.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <span className="font-medium">{code?.labor_code || ln.labor_code_id}</span>
                <span className="ml-2 text-slate-600">
                  List ${ln.list_price ?? "—"} · Charge ${ln.labor_charge ?? "—"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeLine(ln.id)}
                className="text-red-700 hover:underline"
              >
                Remove
              </button>
            </li>
          );
        })}
        {lines.length === 0 && <li className="py-4 text-slate-600">No labor lines yet.</li>}
      </ul>
    </div>
  );
}
