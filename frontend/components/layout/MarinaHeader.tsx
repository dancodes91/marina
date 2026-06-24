import Link from "next/link";
import { Anchor } from "lucide-react";

import { cn } from "@/lib/utils";
import { MarinaPattern } from "./marina-pattern";

interface MarinaHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function MarinaHeader({
  title = "Marina Service Portal",
  subtitle,
  className,
  children,
}: MarinaHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden marina-gradient text-primary-foreground shadow-md",
        className
      )}
    >
      <MarinaPattern className="opacity-30" opacity={0.08} />
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <Anchor className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
            {subtitle && (
              <p className="text-sm text-primary-foreground/75">{subtitle}</p>
            )}
          </div>
        </Link>
        {children && <nav className="flex items-center gap-2">{children}</nav>}
      </div>
    </header>
  );
}
