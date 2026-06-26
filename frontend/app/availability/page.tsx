"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { SlipGrid } from "@/components/availability/SlipGrid";
import { StorageList } from "@/components/availability/StorageList";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { marinaConfig } from "@/lib/marina";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import type { AvailabilitySlip, AvailabilityStorage } from "@/types";

export default function AvailabilityPage() {
  const [slips, setSlips] = useState<AvailabilitySlip[]>([]);
  const [storage, setStorage] = useState<AvailabilityStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<AvailabilitySlip[]>("/api/v1/reservations/availability/slips", { token: null }),
      apiFetch<AvailabilityStorage[]>("/api/v1/reservations/availability/storage", { token: null }),
    ])
      .then(([s, st]) => {
        setSlips(s);
        setStorage(st);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load availability"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader
        title="Slips & Storage"
        subtitle={marinaConfig.name}
        guestCta={{ href: "/reservations/new", label: "Request reservation →" }}
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="section-label mb-2">Availability</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Wet slips & <span className="marina-text-gradient">storage</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Current options at {marinaConfig.name}. Sign in to submit a reservation request.
          </p>
          <Link
            href="/reservations/new"
            className="mt-4 inline-block text-sm font-semibold text-accent hover:text-primary"
          >
            Request reservation →
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <Tabs defaultValue="slips">
            <TabsList className="mb-6">
              <TabsTrigger value="slips">Wet slips ({slips.length})</TabsTrigger>
              <TabsTrigger value="storage">Storage ({storage.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="slips">
              <SlipGrid slips={slips} />
            </TabsContent>
            <TabsContent value="storage">
              <StorageList items={storage} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
