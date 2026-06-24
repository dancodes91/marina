"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api";
import type { SyncLog, SyncStatus } from "@/types";

export default function SyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [s, l] = await Promise.all([
        apiFetch<SyncStatus>("/api/v1/sync/status"),
        apiFetch<SyncLog[]>("/api/v1/sync/log"),
      ]);
      setStatus(s);
      setLogs(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function trigger() {
    setTriggering(true);
    try {
      const r = await apiFetch<{ task_id: string }>("/api/v1/sync/trigger", { method: "POST" });
      toast.success(`Sync triggered (task ${r.task_id})`);
      setTimeout(load, 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to trigger sync");
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-2 pt-6 text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sync Status</CardTitle>
            <CardDescription>Wallace marina data bridge — customers, boats, and inventory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Last successful sync</p>
                <p className="text-lg font-semibold text-primary">
                  {status?.last_sync ? new Date(status.last_sync).toLocaleString() : "Never"}
                </p>
              </div>
              {status?.status && <Badge variant="accent">{status.status}</Badge>}
            </div>

            {status?.counts && Object.keys(status.counts).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(status.counts).map(([key, value]) => (
                  <Badge key={key} variant="secondary">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={trigger} disabled={triggering}>
                <RefreshCw className={`h-4 w-4 ${triggering ? "animate-spin" : ""}`} />
                {triggering ? "Triggering…" : "Trigger sync"}
              </Button>
              <Button variant="outline" onClick={load} disabled={loading}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>CSV exports from Wallace are ingested via the bridge service or desktop upload.</p>
            <p>Triggering sync queues a Celery task to process pending files.</p>
            <Separator />
            <p className="text-xs">
              Upload endpoint: <code className="rounded bg-muted px-1">POST /api/v1/wallace-exports/upload</code>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
          <CardDescription>Last sync job executions and log output</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading sync history…</p>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sync runs recorded yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {log.status === "SUCCESS" || log.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium">{log.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.started_at).toLocaleString()}
                    {log.finished_at && ` → ${new Date(log.finished_at).toLocaleString()}`}
                  </span>
                </div>
                {log.error_message && (
                  <p className="mt-2 text-sm text-destructive">{log.error_message}</p>
                )}
                {log.lines.length > 0 && (
                  <ul className="mt-3 max-h-40 space-y-1 overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                    {log.lines.slice(0, 15).map((ln, i) => (
                      <li key={i}>
                        [{ln.level}] {ln.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
