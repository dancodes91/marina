"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { RESERVATION_STATUSES, type Reservation, type ReservationStatus } from "@/types";

const statusVariant: Record<ReservationStatus, "default" | "secondary" | "accent" | "outline" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  ACTIVE: "accent",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export default function ManagerReservationsPage() {
  const [rows, setRows] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = filter && filter !== "all" ? `?status=${encodeURIComponent(filter)}` : "";
    apiFetch<Reservation[]>(`/api/v1/reservations/manager${q}`)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Reservation Queue</CardTitle>
            <CardDescription>
              Slip and storage reservations awaiting review or currently active.
            </CardDescription>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {RESERVATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <div className="rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Slip size</TableHead>
                  <TableHead className="hidden lg:table-cell">Dates</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Loading reservations…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No reservations in this queue.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.request_number}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.reservation_type.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {r.requested_slip_size || r.assigned_slip_id || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {r.start_date ? new Date(r.start_date).toLocaleDateString() : "—"}
                        {r.end_date ? ` → ${new Date(r.end_date).toLocaleDateString()}` : ""}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{r.payment_status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
