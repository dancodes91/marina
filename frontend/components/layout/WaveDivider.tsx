"use client";

import { cn } from "@/lib/utils";

interface WaveDividerProps {
  className?: string;
  flip?: boolean;
  variant?: "sand" | "navy" | "teal";
}

const fillMap = {
  sand: "hsl(var(--marina-sand))",
  navy: "hsl(var(--marina-navy))",
  teal: "hsl(var(--marina-teal))",
};

export function WaveDivider({ className, flip = false, variant = "sand" }: WaveDividerProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden leading-[0]",
        flip && "rotate-180",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block h-12 w-full animate-wave-drift md:h-16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,0 1440,40 L1440,80 L0,80 Z"
          fill={fillMap[variant]}
        />
        <path
          d="M0,50 C240,20 480,70 720,50 C960,30 1200,70 1440,50 L1440,80 L0,80 Z"
          fill={fillMap[variant]}
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
