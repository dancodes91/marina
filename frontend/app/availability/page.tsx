"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { SlipGrid } from "@/components/availability/SlipGrid";
import { StorageList } from "@/components/availability/StorageList";
import { MarinaHeader } from "@/components/layout/MarinaHeader";
import { WaveDivider } from "@/components/layout/WaveDivider";
import { Button } from "@/components/ui/button";
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
      <MarinaHeader title="Slips & Storage" subtitle="Current availability at Rhode River Marina">
        <Button asChild variant="secondary" size="sm">
          <Link href="/">Home</Link>
        </Button>
      </MarinaHeader>
      <WaveDivider variant="sand" />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary sm:text-3xl">Browse availability</h1>
            <p className="mt-1 text-muted-foreground">
              Wet slips and winter storage options. Sign in to submit a reservation request.
            </p>
          </div>
          <Button asChild variant="accent">
            <Link href="/reservations/new">Request reservation</Link>
          </Button>
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
