import type { FormType } from "@/types";

export type ChecklistItem = {
  id: string;
  label: string;
  description?: string;
  group?: string;
};

export const WINTER_CHECKLIST: ChecklistItem[] = [
  { id: "winter-engine", label: "Engine winterization", group: "Engine", description: "Fog, stabilize, and protect inboard/outboard/I-O" },
  { id: "winter-fuel", label: "Fuel stabilizer treatment", group: "Engine" },
  { id: "winter-freshwater", label: "Freshwater system antifreeze", group: "Systems" },
  { id: "winter-raw-water", label: "Raw water flush & antifreeze", group: "Systems" },
  { id: "winter-head", label: "Head winterization", group: "Systems" },
  { id: "winter-battery", label: "Battery remove & store", group: "Electrical" },
  { id: "winter-shrink", label: "Shrink wrap", group: "Storage" },
  { id: "winter-cover", label: "Winter cover install", group: "Storage" },
  { id: "winter-derig", label: "Sail de-rig / mast step", group: "Rigging" },
  { id: "winter-bilge", label: "Bilge pump service", group: "Systems" },
  { id: "winter-interior", label: "Interior moisture control", group: "Storage" },
];

export const SPRING_CHECKLIST: ChecklistItem[] = [
  { id: "spring-dewinter", label: "Engine de-winterization", group: "Engine", description: "Commissioning and startup" },
  { id: "spring-oil", label: "Oil & filter change", group: "Engine" },
  { id: "spring-lower-unit", label: "Lower unit / drive service", group: "Engine" },
  { id: "spring-impeller", label: "Impeller inspection / replacement", group: "Engine" },
  { id: "spring-plugs", label: "Spark plugs (if applicable)", group: "Engine" },
  { id: "spring-battery", label: "Battery install & load test", group: "Electrical" },
  { id: "spring-systems", label: "Fluid levels & systems check", group: "Systems" },
  { id: "spring-wash", label: "Wash, wax & detail", group: "Cosmetic" },
  { id: "spring-bottom", label: "Bottom paint touch-up", group: "Hull" },
  { id: "spring-sea-trial", label: "Sea trial", group: "Delivery" },
];

export const GENERAL_CHECKLIST: ChecklistItem[] = [
  { id: "gen-engine", label: "Engine repair / diagnostics", group: "Engine" },
  { id: "gen-electrical", label: "Electrical systems", group: "Electrical" },
  { id: "gen-plumbing", label: "Plumbing & sanitation", group: "Systems" },
  { id: "gen-hull", label: "Hull & gelcoat repair", group: "Hull" },
  { id: "gen-canvas", label: "Canvas & upholstery", group: "Cosmetic" },
  { id: "gen-electronics", label: "Electronics / GPS", group: "Electrical" },
  { id: "gen-prop", label: "Propeller / running gear", group: "Engine" },
  { id: "gen-trailer", label: "Trailer service", group: "Trailer" },
  { id: "gen-custom", label: "Other (describe below)", group: "Other" },
];

export const CHECKLISTS: Record<FormType, ChecklistItem[]> = {
  WINTER: WINTER_CHECKLIST,
  SPRING: SPRING_CHECKLIST,
  GENERAL: GENERAL_CHECKLIST,
};

export function getChecklist(formType: FormType): ChecklistItem[] {
  return CHECKLISTS[formType] ?? GENERAL_CHECKLIST;
}

export function parseFormType(value: string | null | undefined): FormType {
  const v = (value ?? "GENERAL").toUpperCase();
  if (v === "WINTER" || v === "SPRING" || v === "GENERAL") return v;
  return "GENERAL";
}
