"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, apiUpload } from "@/lib/api";
import { marinaConfig } from "@/lib/marina";
import type { LandingGalleryImage, LandingGalleryManageResponse } from "@/types";

function normalizeManageResponse(
  data: LandingGalleryManageResponse | LandingGalleryImage[]
): LandingGalleryManageResponse {
  if (Array.isArray(data)) {
    return {
      images: data,
      stats: { active_count: data.length, total_count: data.length },
      hero: { label: "", title: "" },
    };
  }

  return {
    images: data.images ?? [],
    stats: data.stats ?? { active_count: 0, total_count: 0 },
    hero: data.hero ?? { label: "", title: "" },
  };
}

export default function LandingGalleryPage() {
  const [rows, setRows] = useState<LandingGalleryImage[]>([]);
  const [heroLabel, setHeroLabel] = useState(marinaConfig.name);
  const [heroTitle, setHeroTitle] = useState(marinaConfig.subtitle);
  const [savingHero, setSavingHero] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadInFlightRef = useRef(false);
  const lastUploadKeyRef = useRef<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = normalizeManageResponse(
        await apiFetch<LandingGalleryManageResponse | LandingGalleryImage[]>(
          "/api/v1/manager/landing-gallery"
        )
      );
      setRows(data.images);
      if (data.hero.label) setHeroLabel(data.hero.label);
      if (data.hero.title) setHeroTitle(data.hero.title);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function saveHero() {
    setSavingHero(true);
    try {
      const hero = await apiFetch<{ label: string; title: string }>(
        "/api/v1/manager/landing-gallery/hero",
        {
          method: "POST",
          body: JSON.stringify({ label: heroLabel.trim(), title: heroTitle.trim() }),
        }
      );
      setHeroLabel(hero.label);
      setHeroTitle(hero.title);
      toast.success("Carousel text updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingHero(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadFile(file: File) {
    const uploadKey = `${file.name}:${file.size}:${file.lastModified}`;
    if (uploadInFlightRef.current || lastUploadKeyRef.current === uploadKey) {
      return;
    }
    uploadInFlightRef.current = true;
    lastUploadKeyRef.current = uploadKey;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiUpload<LandingGalleryImage>(
        "/api/v1/manager/landing-gallery/upload",
        formData
      );
      toast.success("Image added to landing gallery");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      uploadInFlightRef.current = false;
      window.setTimeout(() => {
        if (lastUploadKeyRef.current === uploadKey) {
          lastUploadKeyRef.current = null;
        }
      }, 2000);
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(row: LandingGalleryImage) {
    if (!confirm("Remove this image from the landing carousel?")) return;
    try {
      await apiFetch(`/api/v1/manager/landing-gallery/files/${encodeURIComponent(row.filename)}`, {
        method: "DELETE",
      });
      toast.success("Image removed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function move(row: LandingGalleryImage, direction: "up" | "down") {
    const activeRows = [...(rows ?? [])];
    const currentIndex = activeRows.findIndex((item) => item.filename === row.filename);
    if (currentIndex < 0) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= activeRows.length) return;

    [activeRows[currentIndex], activeRows[targetIndex]] = [
      activeRows[targetIndex],
      activeRows[currentIndex],
    ];

    try {
      await apiFetch("/api/v1/manager/landing-gallery/reorder", {
        method: "POST",
        body: JSON.stringify({ filenames: activeRows.map((item) => item.filename) }),
      });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reorder failed");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Carousel text</CardTitle>
          <CardDescription>
            The label and headline shown over the landing page image carousel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hero-label">Label</Label>
              <Input
                id="hero-label"
                value={heroLabel}
                onChange={(e) => setHeroLabel(e.target.value)}
                placeholder="Marina name"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-title">Headline</Label>
              <Input
                id="hero-title"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Service & storage portal"
                maxLength={500}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => void saveHero()}
            disabled={savingHero || !heroLabel.trim() || !heroTitle.trim()}
          >
            {savingHero ? "Saving…" : "Save carousel text"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Landing gallery</CardTitle>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void uploadFile(file);
              }}
            />
            <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <ImagePlus className="mr-2 h-4 w-4" />
              {uploading ? "Uploading…" : "Upload image"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Preview</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (rows ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No images yet. Upload one to replace the default carousel slide.
                  </TableCell>
                </TableRow>
              ) : (
                (rows ?? []).map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.url}
                        alt={row.alt_text ?? "Gallery preview"}
                        className="h-14 w-24 rounded-md object-cover ring-1 ring-border"
                      />
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs">{row.filename}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.sort_order}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(row, "up")}
                          disabled={index === 0}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(row, "down")}
                          disabled={index === (rows ?? []).length - 1}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(row)} aria-label="Remove">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
