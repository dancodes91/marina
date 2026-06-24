"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, apiUpload } from "@/lib/api";
import { RATE_TYPES, type LaborCode, type LaborCodeInput, type RateType } from "@/types";

const emptyForm: LaborCodeInput = {
  labor_code: "",
  job_first_line: "",
  rate_type: "HOURLY",
  estimate_labor_list: "",
  hourly_rate: "",
};

export default function LaborCodesPage() {
  const [rows, setRows] = useState<LaborCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LaborCode | null>(null);
  const [form, setForm] = useState<LaborCodeInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<LaborCode[]>("/api/v1/labor-codes?active_only=false");
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(row: LaborCode) {
    setEditing(row);
    setForm({
      labor_code: row.labor_code,
      job_first_line: row.job_first_line,
      rate_type: row.rate_type as RateType,
      estimate_labor_list: row.estimate_labor_list ?? "",
      hourly_rate: row.hourly_rate ?? "",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.labor_code.trim()) {
      toast.error("Labor code is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        job_first_line: form.job_first_line || null,
        estimate_labor_list: form.estimate_labor_list || null,
        hourly_rate: form.hourly_rate || null,
      };
      if (editing) {
        const { labor_code: _, ...patch } = payload;
        await apiFetch(`/api/v1/labor-codes/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        toast.success("Labor code updated");
      } else {
        await apiFetch("/api/v1/labor-codes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Labor code created");
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await apiUpload<{ imported: number }>("/api/v1/labor-codes/import", fd);
      toast.success(`Imported ${result.imported} labor codes`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Labor Codes</CardTitle>
            <CardDescription>Manage Wallace labor codes used on service estimates.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
              <Upload className="h-4 w-4" />
              {importing ? "Importing…" : "Import CSV"}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <div className="rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Rate type</TableHead>
                  <TableHead>List</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Loading labor codes…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No labor codes yet. Import a CSV or add one manually.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.labor_code}</TableCell>
                      <TableCell>{r.job_first_line || "—"}</TableCell>
                      <TableCell>{r.rate_type}</TableCell>
                      <TableCell>{r.estimate_labor_list ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.is_active ? "accent" : "secondary"}>
                          {r.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit labor code" : "New labor code"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the labor code details. Code identifier cannot be changed."
                : "Add a new labor code to the marina catalog."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="labor_code">Code</Label>
              <Input
                id="labor_code"
                value={form.labor_code}
                onChange={(e) => setForm((f) => ({ ...f, labor_code: e.target.value }))}
                disabled={!!editing}
                placeholder="e.g. LAB-100"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job_first_line">Description</Label>
              <Input
                id="job_first_line"
                value={form.job_first_line ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, job_first_line: e.target.value }))}
                placeholder="Short job description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Rate type</Label>
              <Select
                value={form.rate_type}
                onValueChange={(v) => setForm((f) => ({ ...f, rate_type: v as RateType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATE_TYPES.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      {rt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="estimate_labor_list">List price</Label>
                <Input
                  id="estimate_labor_list"
                  type="number"
                  step="0.01"
                  value={form.estimate_labor_list ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, estimate_labor_list: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hourly_rate">Hourly rate</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={form.hourly_rate ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, hourly_rate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
