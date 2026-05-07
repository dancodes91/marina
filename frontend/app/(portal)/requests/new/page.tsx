"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Boat } from "@/types";

export default function NewRequestPage() {
  const router = useRouter();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [boatId, setBoatId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [slot, setSlot] = useState("Any");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<Boat[]>("/api/v1/boats")
      .then((b) => {
        setBoats(b);
        if (b[0]) setBoatId(b[0].id);
      })
      .catch(() => setError("Could not load boats"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        boat_id: boatId,
        category: category || null,
        description: description || null,
        customer_notes: notes || null,
        preferred_time_slot: slot,
      };
      if (preferredDate) body.preferred_date = preferredDate;
      const created = await apiFetch<{ id: string }>("/api/v1/requests", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.replace(`/requests/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">New service request</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Boat</label>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={boatId}
            onChange={(e) => setBoatId(e.target.value)}
            required
          >
            {boats.map((b) => (
              <option key={b.id} value={b.id}>
                {(b.make || "Boat") + (b.wallace_stock_id ? ` (${b.wallace_stock_id})` : "")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Category</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Engine, Electrical, Hull…"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Description</label>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Additional notes</label>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Preferred date</label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Time</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              <option>Morning</option>
              <option>Afternoon</option>
              <option>Any</option>
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !boatId}
            className="rounded-lg bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit request"}
          </button>
          <Link href="/dashboard" className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 hover:bg-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
