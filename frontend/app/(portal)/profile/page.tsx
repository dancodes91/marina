"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ProfilePage() {
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ email_opt_in: boolean; sms_opt_in: boolean }>("/api/v1/notifications/preferences")
      .then((p) => {
        setEmailOptIn(p.email_opt_in);
        setSmsOptIn(p.sms_opt_in);
      })
      .catch(() => {});
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await apiFetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify({ email_opt_in: emailOptIn, sms_opt_in: smsOptIn }),
      });
      setMsg("Preferences saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Notification preferences</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={emailOptIn} onChange={(e) => setEmailOptIn(e.target.checked)} />
          Email updates
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} />
          SMS updates
        </label>
        {msg && <p className="text-sm text-slate-600">{msg}</p>}
        <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white">
          Save
        </button>
      </form>
    </div>
  );
}
