"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, CreditCard, Plus } from "lucide-react";

import { BoatCard } from "@/components/boats/BoatCard";
import { StatusBadge } from "@/components/requests/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { Boat, ServiceRequestSummary } from "@/types";

export default function DashboardPage() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Boat[]>("/api/v1/boats"),
      apiFetch<ServiceRequestSummary[]>("/api/v1/requests"),
    ])
      .then(([b, r]) => {
        setBoats(b);
        setRequests(r);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = requests.filter(
    (r) => r.status === "SCHEDULED" || r.status === "APPROVED" || r.status === "IN_PROGRESS"
  );
  const invoiced = requests.filter((r) => r.status === "INVOICED");

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">Your boats, requests, and upcoming service</p>
        </div>
        <Button asChild variant="accent">
          <Link href="/requests/new">
            <Plus className="h-4 w-4" />
            New request
          </Link>
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-primary">Your boats</h2>
        {boats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No boats on file yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boats.map((b) => (
              <BoatCard key={b.id} boat={b} />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
            <Calendar className="h-5 w-5 text-accent" />
            Upcoming scheduled
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{r.request_number}</CardTitle>
                    <StatusBadge status={r.status} />
                  </div>
                  <CardDescription>
                    {r.preferred_date
                      ? `Preferred: ${new Date(r.preferred_date).toLocaleDateString()}`
                      : r.category || "Service request"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/requests/${r.id}`} className="text-sm font-medium text-accent hover:underline">
                    View details →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {invoiced.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
            <CreditCard className="h-5 w-5 text-accent" />
            Payment due
          </h2>
          <div className="space-y-2">
            {invoiced.map((r) => (
              <Card key={r.id} className="border-accent/30 bg-accent/5">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-medium">{r.request_number}</p>
                    <p className="text-sm text-muted-foreground">{r.category || "Invoice ready"}</p>
                  </div>
                  <Button asChild variant="accent" size="sm">
                    <Link href={`/requests/${r.id}/pay`}>Pay now</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-primary">All requests</h2>
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
          {requests.length === 0 && !error ? (
            <p className="px-4 py-8 text-center text-muted-foreground">No service requests yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/requests/${r.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <span className="font-medium">{r.request_number}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {r.form_type} · {r.category || "General"}
                      </span>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
