import { cn } from "@/lib/utils";

interface MarinaPatternProps {
  className?: string;
  opacity?: number;
}

export function MarinaPattern({ className, opacity = 0.04 }: MarinaPatternProps) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="marina-anchor-pattern"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(0)"
        >
          <path
            d="M24 4 C22 4 20 6 20 8 C20 10 22 12 24 12 C26 12 28 10 28 8 C28 6 26 4 24 4 Z M24 14 L24 28 M18 22 L30 22 M16 28 C16 34 20 38 24 42 C28 38 32 34 32 28"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeLinecap="round"
            opacity={opacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#marina-anchor-pattern)" />
    </svg>
  );
}
