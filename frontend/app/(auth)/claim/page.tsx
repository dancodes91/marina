"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

export default function ClaimPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/v1/auth/claim-account", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        token: null,
      });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Claim your account"
      description="Paste the token from your invitation email and set a password"
      footer={
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="token">Invitation token</Label>
          <Input
            id="token"
            className="mt-1 font-mono text-sm"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
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
        <Button type="submit" variant="accent" className="w-full" disabled={loading}>
          {loading ? "Activating…" : "Activate account"}
        </Button>
      </form>
    </AuthCard>
  );
}
