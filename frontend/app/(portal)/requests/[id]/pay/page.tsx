"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { PaymentSession, ServiceRequestDetail } from "@/types";

export default function PayRequestPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [req, setReq] = useState<ServiceRequestDetail | null>(null);
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<ServiceRequestDetail>(`/api/v1/requests/${id}`)
      .then(setReq)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [id]);

  async function startPayment() {
    if (!req?.invoice_amount) {
      setError("No invoice amount on this request");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<PaymentSession>("/api/v1/payments/create-session", {
        method: "POST",
        body: JSON.stringify({
          service_request_id: req.id,
          amount: req.invoice_amount,
        }),
      });
      setSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  if (error && !req) return <p className="text-destructive">{error}</p>;
  if (!req) return <p className="text-muted-foreground">Loading…</p>;

  const amount = req.invoice_amount
    ? `$${parseFloat(req.invoice_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : "—";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href={`/requests/${id}`} className="text-sm text-accent hover:underline">
          ← Back to request
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-primary">Pay invoice</h1>
        <p className="text-muted-foreground">{req.request_number}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-accent" />
            Payment summary
          </CardTitle>
          <CardDescription>Secure checkout powered by Gravity Payments (stub mode)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Amount due</p>
            <p className="text-3xl font-bold text-primary">{amount}</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {!session ? (
            <Button
              type="button"
              variant="accent"
              className="w-full"
              disabled={loading || req.status !== "INVOICED" || !req.invoice_amount}
              onClick={startPayment}
            >
              {loading ? "Creating session…" : "Continue to payment"}
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
              <p className="text-sm font-medium text-primary">Checkout session created</p>
              <p className="text-xs text-muted-foreground">Session ID: {session.session_id}</p>
              <Button asChild variant="accent" className="w-full">
                <a href={session.checkout_url} target="_blank" rel="noopener noreferrer">
                  Open payment page
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => router.push(`/requests/${id}`)}>
                Return to request
              </Button>
            </div>
          )}

          {req.status !== "INVOICED" && (
            <p className="text-sm text-muted-foreground">
              This request is not yet invoiced. You will be notified when payment is due.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
