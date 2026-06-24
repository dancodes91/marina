"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import type { NotificationLogEntry } from "@/types";

const channelVariant = {
  EMAIL: "default",
  SMS: "accent",
} as const;

export default function ManagerNotificationsPage() {
  const [rows, setRows] = useState<NotificationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<NotificationLogEntry[]>("/api/v1/manager/notifications/log")
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const failed = rows.filter((r) => r.status === "FAILED").length;
  const sent = rows.filter((r) => r.status === "SENT" || r.status === "DELIVERED").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total logged</CardDescription>
            <CardTitle className="text-3xl">{rows.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Delivered</CardDescription>
            <CardTitle className="text-3xl text-accent">{sent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-destructive">{failed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Log</CardTitle>
          <CardDescription>Email and SMS delivery history across all customers.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <div className="rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden lg:table-cell">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Loading notification log…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No notifications logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            channelVariant[r.channel as keyof typeof channelVariant] ?? "secondary"
                          }
                        >
                          {r.channel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "FAILED" ? "destructive" : "secondary"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{r.recipient || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.subject || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[240px] truncate text-destructive">
                        {r.error_message || "—"}
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
