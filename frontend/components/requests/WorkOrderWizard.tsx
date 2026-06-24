"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { parseFormType } from "@/config/job-checklists";
import { JobChecklist } from "@/components/requests/JobChecklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { Boat, FormType } from "@/types";

const STEPS = ["Your info", "Select boat", "Select jobs", "Schedule & files"] as const;

const FORM_LABELS: Record<FormType, string> = {
  WINTER: "Winterization",
  SPRING: "Spring commissioning",
  GENERAL: "General service",
};

interface WorkOrderWizardProps {
  initialFormType?: string | null;
}

export function WorkOrderWizard({ initialFormType }: WorkOrderWizardProps) {
  const router = useRouter();
  const formType = parseFormType(initialFormType);
  const [step, setStep] = useState(0);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [boatId, setBoatId] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [customDescription, setCustomDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("Any");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Boat[]>("/api/v1/boats")
      .then((b) => {
        setBoats(b);
        if (b[0]) setBoatId(b[0].id);
      })
      .catch(() => setError("Could not load your boats"));
  }, []);

  const progress = ((step + 1) / STEPS.length) * 100;

  async function uploadAttachments(requestId: string, fileList: FileList) {
    for (const file of Array.from(fileList)) {
      const presign = await apiFetch<{ upload_url: string }>(
        `/api/v1/requests/${requestId}/attachments`,
        {
          method: "POST",
          body: JSON.stringify({ filename: file.name, content_type: file.type || "application/octet-stream" }),
        }
      );
      await fetch(presign.upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
    }
  }

  async function submit() {
    if (!boatId) {
      setError("Please select a boat");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const notes = [customerNotes, contactPhone ? `Callback: ${contactPhone}` : ""]
        .filter(Boolean)
        .join("\n");

      const body = {
        boat_id: boatId,
        form_type: formType,
        category: FORM_LABELS[formType],
        description: customDescription || `${FORM_LABELS[formType]} work order`,
        custom_description: customDescription || null,
        job_selections: selectedJobs,
        customer_notes: notes || null,
        preferred_time_slot: timeSlot,
        ...(preferredDate ? { preferred_date: preferredDate } : {}),
      };

      const created = await apiFetch<{ id: string }>("/api/v1/requests", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (files && files.length > 0) {
        await uploadAttachments(created.id, files);
      }

      toast.success("Work order submitted");
      router.replace(`/requests/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (step === 1 && !boatId) {
      setError("Please select a boat");
      return;
    }
    if (step === 2 && selectedJobs.length === 0 && formType !== "GENERAL") {
      setError("Select at least one job");
      return;
    }
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else void submit();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-accent">{FORM_LABELS[formType]}</p>
        <h1 className="text-2xl font-bold text-primary">New work order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
        <Progress value={progress} className="mt-4" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            {step === 0 && "Confirm how we can reach you about this request."}
            {step === 1 && "Choose the boat this work order applies to."}
            {step === 2 && "Select the services you need from our checklist."}
            {step === 3 && "Pick a preferred date and attach photos if helpful."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div>
                <Label htmlFor="phone">Best callback number (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  className="mt-1"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(410) 555-0100"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes for the service team</Label>
                <Textarea
                  id="notes"
                  className="mt-1"
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Access instructions, special requests…"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <div>
              <Label>Boat</Label>
              {boats.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No boats on file. Contact the marina to add your vessel.
                </p>
              ) : (
                <Select value={boatId} onValueChange={setBoatId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select boat" />
                  </SelectTrigger>
                  <SelectContent>
                    {boats.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {[b.year, b.make, b.model].filter(Boolean).join(" ") ||
                          `Boat ${b.wallace_stock_id ?? b.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {step === 2 && (
            <JobChecklist
              formType={formType}
              selected={selectedJobs}
              onChange={setSelectedJobs}
              customDescription={customDescription}
              onCustomDescriptionChange={setCustomDescription}
            />
          )}

          {step === 3 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="date">Preferred date</Label>
                  <Input
                    id="date"
                    type="date"
                    className="mt-1"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Time preference</Label>
                  <Select value={timeSlot} onValueChange={setTimeSlot}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Afternoon">Afternoon</SelectItem>
                      <SelectItem value="Any">Any time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="files">Photos or documents (optional)</Label>
                <Input
                  id="files"
                  type="file"
                  className="mt-1"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles(e.target.files)}
                />
                <p className="mt-1 text-xs text-muted-foreground">Images and PDFs up to 10 MB each</p>
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-3 pt-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
                Back
              </Button>
            )}
            <Button type="button" variant="accent" onClick={next} disabled={loading || (step === 1 && !boatId)}>
              {loading ? "Submitting…" : step === STEPS.length - 1 ? "Submit work order" : "Continue"}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
