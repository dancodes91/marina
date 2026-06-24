"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { Boat, ReservationType } from "@/types";

const RESERVATION_TYPES: { value: ReservationType; label: string }[] = [
  { value: "WET_SLIP", label: "Wet slip" },
  { value: "DRY_RACK", label: "Dry rack" },
  { value: "INDOOR_STORAGE", label: "Indoor storage" },
  { value: "OUTDOOR_STORAGE", label: "Outdoor storage" },
  { value: "TRAILER", label: "Trailer storage" },
  { value: "MOORING", label: "Mooring" },
];

export default function NewReservationPage() {
  const router = useRouter();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [boatId, setBoatId] = useState("");
  const [reservationType, setReservationType] = useState<ReservationType>("WET_SLIP");
  const [slipSize, setSlipSize] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        reservation_type: reservationType,
        notes: notes || null,
      };
      if (boatId) body.boat_id = boatId;
      if (slipSize) body.requested_slip_size = slipSize;
      if (startDate) body.start_date = startDate;
      if (endDate) body.end_date = endDate;

      const created = await apiFetch<{ id: string; request_number: string }>("/api/v1/reservations", {
        method: "POST",
        body: JSON.stringify(body),
      });
      toast.success(`Reservation ${created.request_number} submitted`);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/availability" className="text-sm text-accent hover:underline">
          ← View availability
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-primary">Request reservation</h1>
        <p className="text-muted-foreground">Submit a slip or storage reservation request</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservation details</CardTitle>
          <CardDescription>Our team will review and confirm availability</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Reservation type</Label>
              <Select value={reservationType} onValueChange={(v) => setReservationType(v as ReservationType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESERVATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {boats.length > 0 && (
              <div>
                <Label>Boat</Label>
                <Select value={boatId} onValueChange={setBoatId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select boat" />
                  </SelectTrigger>
                  <SelectContent>
                    {boats.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {[b.year, b.make, b.model].filter(Boolean).join(" ") || b.wallace_stock_id || "Boat"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="slip-size">Preferred slip / space size</Label>
              <Input
                id="slip-size"
                className="mt-1"
                value={slipSize}
                onChange={(e) => setSlipSize(e.target.value)}
                placeholder="e.g. 35' slip"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="start">Start date</Label>
                <Input
                  id="start"
                  type="date"
                  className="mt-1"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end">End date</Label>
                <Input
                  id="end"
                  type="date"
                  className="mt-1"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                className="mt-1"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special requirements, boat dimensions…"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="accent" disabled={loading}>
                {loading ? "Submitting…" : "Submit reservation"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
