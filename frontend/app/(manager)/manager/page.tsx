"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Anchor,
  Bell,
  ClipboardList,
  RefreshCw,
  Ship,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/requests/StatusBadge";
import { apiFetch } from "@/lib/api";
import type {
  NotificationLogEntry,
  Reservation,
  ServiceRequestSummary,
  SyncStatus,
} from "@/types";

type StatCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
};

function StatCard({ title, value, description, icon: Icon, href }: StatCardProps) {
  const content = (
    <Card className="border-border/60 transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-md bg-accent/10 p-2 text-accent">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        {content}
      </Link>
    );
  }
  return content;
}

export default function ManagerDashboardPage() {
  const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [notifications, setNotifications] = useState<NotificationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch<ServiceRequestSummary[]>("/api/v1/manager/requests"),
      apiFetch<Reservation[]>("/api/v1/reservations/manager"),
      apiFetch<SyncStatus>("/api/v1/sync/status"),
      apiFetch<NotificationLogEntry[]>("/api/v1/manager/notifications/log"),
    ])
      .then(([reqs, res, syncStatus, logs]) => {
        setRequests(reqs);
        setReservations(res);
        setSync(syncStatus);
        setNotifications(logs);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const pendingRequests = requests.filter((r) =>
    ["SUBMITTED", "UNDER_REVIEW", "PENDING_APPROVAL"].includes(r.status)
  ).length;
  const activeWork = requests.filter((r) =>
    ["SCHEDULED", "IN_PROGRESS", "APPROVED"].includes(r.status)
  ).length;
  const activeReservations = reservations.filter((r) =>
    ["ACTIVE", "APPROVED"].includes(r.status)
  ).length;
  const pendingReservations = reservations.filter((r) => r.status === "PENDING").length;
  const failedNotifications = notifications.filter((n) => n.status === "FAILED").length;
  const recentRequests = requests.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          Overview of service operations, slip reservations, and marina sync health.
        </p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          description="Awaiting review or approval"
          icon={ClipboardList}
          href="/manager/requests"
        />
        <StatCard
          title="Active Work"
          value={activeWork}
          description="Scheduled or in progress"
          icon={Wrench}
          href="/manager/requests"
        />
        <StatCard
          title="Active Reservations"
          value={activeReservations}
          description="Approved or on the water"
          icon={Anchor}
          href="/manager/reservations"
        />
        <StatCard
          title="Reservation Queue"
          value={pendingReservations}
          description="Pending slip assignments"
          icon={Ship}
          href="/manager/reservations"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Requests</CardTitle>
              <CardDescription>Latest service requests in the queue</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/manager/requests">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No requests yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentRequests.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/manager/requests/${r.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-md"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.request_number}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.category || "General"} · {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
            <CardDescription>Wallace sync and notification delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Last Wallace Sync</p>
                  <p className="text-xs text-muted-foreground">
                    {sync?.last_sync ? new Date(sync.last_sync).toLocaleString() : "Never run"}
                  </p>
                  {sync?.counts && Object.keys(sync.counts).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(sync.counts).map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="text-xs">
                          {k}: {v}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/manager/sync">Manage</Link>
              </Button>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex gap-3">
                <div className="rounded-md bg-accent/10 p-2 text-accent">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Notification Failures</p>
                  <p className="text-xs text-muted-foreground">
                    {failedNotifications} failed of {notifications.length} recent deliveries
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/manager/notifications">View log</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
