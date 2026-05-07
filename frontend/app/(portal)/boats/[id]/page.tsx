"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Boat } from "@/types";

export default function BoatDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [boat, setBoat] = useState<Boat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [engineMake, setEngineMake] = useState("");
  const [engineModel, setEngineModel] = useState("");
  const [engineHours, setEngineHours] = useState("");

  useEffect(() => {
    apiFetch<Boat>(`/api/v1/boats/${id}`)
      .then((b) => {
        setBoat(b);
        setEngineMake(b.engine_make || "");
        setEngineModel(b.engine_model || "");
        setEngineHours(b.engine_hours || "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [id]);

  async function save() {
    try {
      const b = await apiFetch<Boat>(`/api/v1/boats/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          engine_make: engineMake || null,
          engine_model: engineModel || null,
          engine_hours: engineHours ? Number(engineHours) : null,
        }),
      });
      setBoat(b);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!boat) return <p className="text-slate-600">Loading…</p>;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">
        {boat.make || "Boat"} {boat.model || ""}
      </h1>
      <p className="text-sm text-slate-600">Stock: {boat.wallace_stock_id || "—"} · Slip: {boat.slip_id || "—"}</p>
      <div className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">Engine (optional)</h2>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Make</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={engineMake}
            onChange={(e) => setEngineMake(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Model</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={engineModel}
            onChange={(e) => setEngineModel(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Hours</label>
          <input
            type="number"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={engineHours}
            onChange={(e) => setEngineHours(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Save
        </button>
      </div>
    </div>
  );
}
