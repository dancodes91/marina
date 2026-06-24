"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";

import { getChecklist } from "@/config/job-checklists";
import { RequestTimeline } from "@/components/requests/RequestTimeline";
import { StatusBadge } from "@/components/requests/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api";
import { getStatusCopy } from "@/lib/request-status-copy";
import type { RequestStatus, ServiceRequestDetail, TimelineEvent } from "@/types";

function formatMoney(value: string | null | undefined) {
  if (value == null) return null;
  const n = parseFloat(value);
  if (Number.isNaN(n)) return null;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [req, setReq] = useState<ServiceRequestDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ServiceRequestDetail>(`/api/v1/requests/${id}`)
      .then(setReq)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
    apiFetch<TimelineEvent[]>(`/api/v1/requests/${id}/timeline`)
      .then(setTimeline)
      .catch(() => {});
  }, [id]);

  async function cancel() {
    if (!confirm("Cancel this request?")) return;
    try {
      await apiFetch(`/api/v1/requests/${id}/cancel`, { method: "POST" });
      const r = await apiFetch<ServiceRequestDetail>(`/api/v1/requests/${id}`);
      setReq(r);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Cancel failed");
    }
  }

  if (error) return <p className="text-destructive">{error}</p>;
  if (!req) return <p className="text-muted-foreground">Loading…</p>;

  const statusCopy = getStatusCopy(req.status as RequestStatus);
  const canCancel = req.status === "SUBMITTED" || req.status === "UNDER_REVIEW";
  const checklist = getChecklist(req.form_type);
  const selectedLabels = (req.job_selections ?? [])
    .map((jid) => checklist.find((c) => c.id === jid)?.label ?? jid)
    .filter(Boolean);
  const estimate = formatMoney(req.total_estimate_list);
  const invoice = formatMoney(req.invoice_amount);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-accent hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-primary">{req.request_number}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={req.status as RequestStatus} />
            <Badge variant="outline">{req.form_type}</Badge>
            {req.payment_status !== "UNPAID" && (
              <Badge variant="secondary">Payment: {req.payment_status}</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {req.status === "INVOICED" && (
            <Button asChild variant="accent">
              <Link href={`/requests/${id}/pay`}>
                <CreditCard className="h-4 w-4" />
                Pay invoice
              </Link>
            </Button>
          )}
          {canCancel && (
            <Button type="button" variant="outline" onClick={cancel} className="text-destructive">
              Cancel request
            </Button>
          )}
        </div>
      </div>

      <Card className="border-accent/20 bg-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{statusCopy.title}</CardTitle>
          <CardDescription className="text-base text-foreground/80">
            {statusCopy.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Work order details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <dl className="grid gap-3">
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="font-medium">{req.description || "—"}</dd>
                </div>
                {req.custom_description && (
                  <div>
                    <dt className="text-muted-foreground">Additional details</dt>
                    <dd className="font-medium">{req.custom_description}</dd>
                  </div>
                )}
                {selectedLabels.length > 0 && (
                  <div>
                    <dt className="mb-1 text-muted-foreground">Selected jobs</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {selectedLabels.map((label) => (
                        <Badge key={label} variant="secondary">
                          {label}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
                {req.customer_notes && (
                  <div>
                    <dt className="text-muted-foreground">Your notes</dt>
                    <dd className="whitespace-pre-wrap font-medium">{req.customer_notes}</dd>
                  </div>
                )}
              </dl>
              <Separator />
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Preferred date</dt>
                  <dd className="font-medium">
                    {req.preferred_date
                      ? new Date(req.preferred_date).toLocaleDateString()
                      : "—"}
                    {req.preferred_time_slot ? ` (${req.preferred_time_slot})` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Scheduled</dt>
                  <dd className="font-medium">
                    {req.scheduled_date
                      ? new Date(req.scheduled_date).toLocaleDateString()
                      : "Not yet scheduled"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Est. completion</dt>
                  <dd className="font-medium">
                    {req.estimated_completion
                      ? new Date(req.estimated_completion).toLocaleDateString()
                      : "—"}
                  </dd>
                </div>
                {req.wallace_ro_number && (
                  <div>
                    <dt className="text-muted-foreground">RO number</dt>
                    <dd className="font-medium">{req.wallace_ro_number}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total estimate</p>
                  <p className="text-3xl font-bold text-primary">{estimate ?? "Pending review"}</p>
                </div>
                {invoice && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Invoice amount</p>
                    <p className="text-2xl font-semibold text-accent">{invoice}</p>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Final pricing may change if additional work is approved during service.
              </p>
            </CardContent>
          </Card>

          {req.attachments && req.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {req.attachments.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                      >
                        View file
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status timeline</CardTitle>
            <CardDescription>Track every step of your work order</CardDescription>
          </CardHeader>
          <CardContent>
            <RequestTimeline events={timeline} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
