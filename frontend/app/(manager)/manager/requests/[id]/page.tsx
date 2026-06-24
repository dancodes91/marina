"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { LaborLineEditor } from "@/components/requests/LaborLineEditor";
import { StatusBadge } from "@/components/requests/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { REQUEST_STATUSES, type LaborCode, type LaborLine, type RequestStatus, type TimelineEvent } from "@/types";
import { toast } from "sonner";

type ManagerReq = {
  id: string;
  request_number: string;
  status: RequestStatus;
  category: string | null;
  description: string | null;
  customer_notes: string | null;
  manager_notes: string | null;
  wallace_ro_number: string | null;
  preferred_date: string | null;
  scheduled_date: string | null;
  total_estimate_list: string | null;
  total_estimate_cost: string | null;
  created_at: string;
  updated_at: string;
};

export default function ManagerRequestDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [req, setReq] = useState<ManagerReq | null>(null);
  const [lines, setLines] = useState<LaborLine[]>([]);
  const [codes, setCodes] = useState<LaborCode[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<RequestStatus>("SUBMITTED");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await apiFetch<ManagerReq>(`/api/v1/manager/requests/${id}`);
    setReq(r);
    setNotes(r.manager_notes || "");
    setStatus(r.status);
    const [l, t] = await Promise.all([
      apiFetch<LaborLine[]>(`/api/v1/manager/requests/${id}/labor`),
      apiFetch<TimelineEvent[]>(`/api/v1/manager/requests/${id}/timeline`),
    ]);
    setLines(l);
    setTimeline(t);
  }, [id]);

  useEffect(() => {
    apiFetch<LaborCode[]>("/api/v1/labor-codes?q=")
      .then(setCodes)
      .catch(() => {});
    load().catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [load]);

  async function saveNotes() {
    setSaving(true);
    try {
      await apiFetch(`/api/v1/manager/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ manager_notes: notes }),
      });
      toast.success("Notes saved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus() {
    setSaving(true);
    try {
      await apiFetch(`/api/v1/manager/requests/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success("Status updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!req) {
    return <p className="text-muted-foreground">Loading request…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 h-8" asChild>
            <Link href="/manager/requests">← Back to queue</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-primary">{req.request_number}</h2>
            <StatusBadge status={req.status} />
          </div>
          {req.wallace_ro_number && (
            <p className="text-sm text-muted-foreground">Wallace RO: {req.wallace_ro_number}</p>
          )}
        </div>
        <Card className="min-w-[200px]">
          <CardContent className="pt-4 text-sm">
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">List estimate</span>
              <span className="font-medium">
                {req.total_estimate_list != null ? `$${req.total_estimate_list}` : "—"}
              </span>
            </div>
            <div className="mt-1 flex justify-between gap-6">
              <span className="text-muted-foreground">Cost estimate</span>
              <span className="font-medium">
                {req.total_estimate_cost != null ? `$${req.total_estimate_cost}` : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="labor">Labor</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request information</CardTitle>
                <CardDescription>Customer submission and scheduling details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{req.category || "General"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p>{req.description || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer notes</p>
                  <p>{req.customer_notes || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Preferred date</p>
                    <p>
                      {req.preferred_date
                        ? new Date(req.preferred_date).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Scheduled date</p>
                    <p>
                      {req.scheduled_date
                        ? new Date(req.scheduled_date).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manager actions</CardTitle>
                <CardDescription>Update status and internal notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <div className="flex flex-wrap gap-2">
                    <Select value={status} onValueChange={(v) => setStatus(v as RequestStatus)}>
                      <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REQUEST_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={changeStatus} disabled={saving}>
                      Update status
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Manager notes</p>
                  <Textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes visible to staff only…"
                  />
                  <Button variant="secondary" onClick={saveNotes} disabled={saving}>
                    Save notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="labor">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Labor lines</CardTitle>
              <CardDescription>Add labor codes and build the work order estimate</CardDescription>
            </CardHeader>
            <CardContent>
              <LaborLineEditor requestId={id} lines={lines} codes={codes} onChanged={load} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status timeline</CardTitle>
              <CardDescription>History of status changes for this request</CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No timeline events yet.</p>
              ) : (
                <ol className="relative space-y-6 border-l border-border/60 pl-6">
                  {timeline.map((event, i) => (
                    <li key={`${event.created_at}-${i}`} className="relative">
                      <span className="absolute -left-[1.6rem] top-1 flex h-3 w-3 rounded-full border-2 border-background bg-accent" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{event.status.replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      {event.note && <p className="mt-1 text-sm text-muted-foreground">{event.note}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
