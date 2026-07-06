"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { marinaConfig } from "@/lib/marina";
import { useMarinaBranding } from "@/hooks/use-marina-branding";
import type { MarinaSettings, MarinaSettingsInput } from "@/types";

const emptyForm: MarinaSettingsInput = {
  name: "",
  subtitle: marinaConfig.subtitle,
  contact_email: null,
  contact_phone: null,
  twilio_from_number: null,
  sync_interval_mins: 15,
};

export default function SettingsPage() {
  const { refresh: refreshBranding } = useMarinaBranding();
  const [slug, setSlug] = useState("");
  const [form, setForm] = useState<MarinaSettingsInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<MarinaSettings>("/api/v1/manager/settings");
      setSlug(data.slug);
      setForm({
        name: data.name,
        subtitle: data.subtitle,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        twilio_from_number: data.twilio_from_number,
        sync_interval_mins: data.sync_interval_mins,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateField<K extends keyof MarinaSettingsInput>(key: K, value: MarinaSettingsInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!form.name.trim() || !form.subtitle.trim()) {
      toast.error("Company name and subtitle are required");
      return;
    }

    setSaving(true);
    try {
      const payload: MarinaSettingsInput = {
        name: form.name.trim(),
        subtitle: form.subtitle.trim(),
        contact_email: form.contact_email?.trim() || null,
        contact_phone: form.contact_phone?.trim() || null,
        twilio_from_number: form.twilio_from_number?.trim() || null,
        sync_interval_mins: form.sync_interval_mins,
      };

      const saved = await apiFetch<MarinaSettings>("/api/v1/manager/settings", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSlug(saved.slug);
      setForm({
        name: saved.name,
        subtitle: saved.subtitle,
        contact_email: saved.contact_email,
        contact_phone: saved.contact_phone,
        twilio_from_number: saved.twilio_from_number,
        sync_interval_mins: saved.sync_interval_mins,
      });
      await refreshBranding();
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Company information</CardTitle>
          <CardDescription>Basic contact details for your marina.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input
              id="company-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Your Dealership Name"
              maxLength={200}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-subtitle">Subtitle</Label>
            <Input
              id="company-subtitle"
              value={form.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="Service & storage portal"
              maxLength={500}
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact email</Label>
              <Input
                id="contact-email"
                type="email"
                value={form.contact_email ?? ""}
                onChange={(e) => updateField("contact_email", e.target.value || null)}
                placeholder="info@example.com"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Contact phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={form.contact_phone ?? ""}
                onChange={(e) => updateField("contact_phone", e.target.value || null)}
                placeholder="+1 (555) 123-4567"
                maxLength={20}
                disabled={loading}
              />
            </div>
          </div>

          {slug && (
            <p className="text-xs text-muted-foreground">
              Marina slug: <code className="rounded bg-muted px-1">{slug}</code>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Notification and sync configuration for this marina.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twilio-from">Twilio from number</Label>
            <Input
              id="twilio-from"
              type="tel"
              value={form.twilio_from_number ?? ""}
              onChange={(e) => updateField("twilio_from_number", e.target.value || null)}
              placeholder="+15551234567"
              maxLength={20}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sync-interval">Sync interval (minutes)</Label>
            <Input
              id="sync-interval"
              type="number"
              min={1}
              max={1440}
              value={form.sync_interval_mins}
              onChange={(e) =>
                updateField("sync_interval_mins", Math.max(1, Number(e.target.value) || 1))
              }
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        onClick={() => void save()}
        disabled={loading || saving || !form.name.trim() || !form.subtitle.trim()}
      >
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
