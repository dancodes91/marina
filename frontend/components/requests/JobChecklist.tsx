"use client";

import { getChecklist } from "@/config/job-checklists";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormType } from "@/types";

interface JobChecklistProps {
  formType: FormType;
  selected: string[];
  onChange: (ids: string[]) => void;
  customDescription: string;
  onCustomDescriptionChange: (value: string) => void;
}

export function JobChecklist({
  formType,
  selected,
  onChange,
  customDescription,
  onCustomDescriptionChange,
}: JobChecklistProps) {
  const items = getChecklist(formType);
  const groups = [...new Set(items.map((i) => i.group ?? "Services"))];

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {group}
          </h3>
          <div className="space-y-3">
            {items
              .filter((i) => (i.group ?? "Services") === group)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3"
                >
                  <Checkbox
                    id={item.id}
                    checked={selected.includes(item.id)}
                    onCheckedChange={() => toggle(item.id)}
                  />
                  <div className="grid gap-1">
                    <Label htmlFor={item.id} className="cursor-pointer font-medium leading-snug">
                      {item.label}
                    </Label>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {(formType === "GENERAL" || selected.includes("gen-custom")) && (
        <div>
          <Label htmlFor="custom-description">Additional details</Label>
          <Textarea
            id="custom-description"
            className="mt-2"
            rows={4}
            placeholder="Describe the work you need…"
            value={customDescription}
            onChange={(e) => onCustomDescriptionChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
