"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { LaborCode } from "@/types";

export default function LaborCodesPage() {
  const [rows, setRows] = useState<LaborCode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<LaborCode[]>("/api/v1/labor-codes")
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Labor codes</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Rate type</th>
              <th className="px-3 py-2">List</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono">{r.labor_code}</td>
                <td className="px-3 py-2">{r.job_first_line || "—"}</td>
                <td className="px-3 py-2">{r.rate_type}</td>
                <td className="px-3 py-2">{r.estimate_labor_list ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-8 text-center text-slate-600">No labor codes.</p>}
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Admins can import CSV via API <code className="rounded bg-slate-200 px-1">POST /api/v1/labor-codes/import</code>.
      </p>
    </div>
  );
}

