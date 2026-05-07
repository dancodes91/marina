"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type SyncStatus = {
  last_sync: string | null;
  status?: string;
  counts: Record<string, number>;
};

type SyncLog = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  error_message: string | null;
  lines: { level: string; message: string }[];
};

export default function SyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const s = await apiFetch<SyncStatus>("/api/v1/sync/status");
      setStatus(s);
      const l = await apiFetch<SyncLog[]>("/api/v1/sync/log");
      setLogs(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function trigger() {
    setMsg(null);
    try {
      const r = await apiFetch<{ task_id: string }>("/api/v1/sync/trigger", { method: "POST" });
      setMsg(`Triggered task ${r.task_id}`);
      setTimeout(load, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Wallace sync</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {msg && <p className="mb-4 text-sm text-green-800">{msg}</p>}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">
          Last sync: {status?.last_sync ? new Date(status.last_sync).toLocaleString() : "Never"}
        </p>
        <pre className="mt-2 text-xs text-slate-800">{JSON.stringify(status?.counts, null, 2)}</pre>
        <button
          type="button"
          onClick={trigger}
          className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Trigger sync (Celery)
        </button>
        <button
          type="button"
          onClick={load}
          className="ml-2 rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>
      <h2 className="mb-2 font-medium text-slate-900">Recent runs</h2>
      <ul className="space-y-3">
        {logs.map((log) => (
          <li key={log.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <div className="font-medium">
              {log.status} · {new Date(log.started_at).toLocaleString()}
            </div>
            {log.error_message && <p className="text-red-700">{log.error_message}</p>}
            <ul className="mt-2 list-inside list-disc text-slate-600">
              {log.lines.slice(0, 10).map((ln, i) => (
                <li key={i}>
                  [{ln.level}] {ln.message}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

