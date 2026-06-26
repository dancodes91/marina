import Link from "next/link";
import { Anchor } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { marinaConfig } from "@/lib/marina";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-background", className)}>
      <div className="absolute inset-0 marina-gradient-soft" />
      <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-marina-coral/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Link href="/" className="mb-10 flex items-center justify-center gap-3 text-foreground">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/8 text-primary ring-1 ring-border/50">
            <Anchor className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight">{marinaConfig.name}</span>
        </Link>
        <Card className="border-border/50 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
            {description && (
              <CardDescription className="text-base">{description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && (
          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
        )}
      </div>
    </div>
  );
}
