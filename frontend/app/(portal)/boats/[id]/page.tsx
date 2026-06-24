"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/requests/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api";
import type { Boat, ServiceRequestSummary } from "@/types";

export default function BoatDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [boat, setBoat] = useState<Boat | null>(null);
  const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [engineMake, setEngineMake] = useState("");
  const [engineModel, setEngineModel] = useState("");
  const [engineHours, setEngineHours] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<Boat>(`/api/v1/boats/${id}`)
      .then((b) => {
        setBoat(b);
        setEngineMake(b.engine_make || "");
        setEngineModel(b.engine_model || "");
        setEngineHours(b.engine_hours || "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));

    apiFetch<ServiceRequestSummary[]>("/api/v1/requests")
      .then(setRequests)
      .catch(() => {});
  }, [id]);

  const history = requests;

  async function save() {
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="text-destructive">{error}</p>;
  if (!boat) return <p className="text-muted-foreground">Loading…</p>;

  const title = [boat.year, boat.make, boat.model].filter(Boolean).join(" ") || "Boat";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-accent hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-primary">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Stock: {boat.wallace_stock_id || "—"} · Slip: {boat.slip_id || "—"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Engine details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="make">Make</Label>
            <Input id="make" className="mt-1" value={engineMake} onChange={(e) => setEngineMake(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            <Input id="model" className="mt-1" value={engineModel} onChange={(e) => setEngineModel(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              className="mt-1"
              value={engineHours}
              onChange={(e) => setEngineHours(e.target.value)}
            />
          </div>
          <Button type="button" variant="accent" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save engine info"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No service requests on file.</p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                  <div>
                    <Link href={`/requests/${r.id}`} className="font-medium text-accent hover:underline">
                      {r.request_number}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {r.form_type} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
