"use client";

import { marinaConfig } from "@/lib/marina";

const PHRASES = [
  "Winterization",
  "Spring commissioning",
  "Slip rentals",
  "Dry rack storage",
  "Online estimates",
  "Track your request",
  marinaConfig.name,
];

export function MarqueeBand() {
  const text = PHRASES.join(" · ");
  return (
    <div className="overflow-hidden border-y border-border/60 bg-primary py-3 text-primary-foreground">
      <div className="flex animate-marquee whitespace-nowrap">
        {[0, 1].map((i) => (
          <span key={i} className="mx-8 text-sm font-medium tracking-wide opacity-90">
            {text} · {text}
          </span>
        ))}
      </div>
    </div>
  );
}
