"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const token = params.get("token") || "";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        token: null,
      });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!token && (
        <p className="text-sm text-amber-700 dark:text-amber-400">Missing token in URL.</p>
      )}
      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          className="mt-1"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="accent" className="w-full" disabled={loading || !token}>
        {loading ? "Saving…" : "Set password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Choose a new password for your account"
      footer={
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </AuthCard>
  );
}
