"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import type { NotificationLogEntry } from "@/types";

export default function ProfilePage() {
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [notifications, setNotifications] = useState<NotificationLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ email_opt_in: boolean; sms_opt_in: boolean }>("/api/v1/notifications/preferences")
      .then((p) => {
        setEmailOptIn(p.email_opt_in);
        setSmsOptIn(p.sms_opt_in);
      })
      .catch(() => {});

    apiFetch<NotificationLogEntry[]>("/api/v1/notifications")
      .then(setNotifications)
      .catch(() => {});
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify({ email_opt_in: emailOptIn, sms_opt_in: smsOptIn }),
      });
      toast.success("Preferences saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Profile & notifications</h1>
        <p className="text-muted-foreground">Manage how we contact you about your work orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification preferences</CardTitle>
          <CardDescription>Choose which channels you want for status updates</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="email-opt"
                checked={emailOptIn}
                onCheckedChange={(v) => setEmailOptIn(v === true)}
              />
              <Label htmlFor="email-opt" className="cursor-pointer">
                Email updates for request status changes
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="sms-opt"
                checked={smsOptIn}
                onCheckedChange={(v) => setSmsOptIn(v === true)}
              />
              <Label htmlFor="sms-opt" className="cursor-pointer">
                SMS text message alerts
              </Label>
            </div>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? "Saving…" : "Save preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Password</CardTitle>
          <CardDescription>
            To change your password, use the forgot-password flow. We will email you a secure reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/forgot-password">Reset password via email</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification history</CardTitle>
          <CardDescription>Recent messages sent to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0">
                  <div>
                    <p className="font-medium">{n.subject || `${n.channel} notification`}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={n.status === "sent" ? "accent" : "secondary"}>{n.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
