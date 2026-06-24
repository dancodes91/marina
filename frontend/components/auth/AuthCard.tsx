import Link from "next/link";
import { Anchor } from "lucide-react";

import { MarinaPattern } from "@/components/layout/marina-pattern";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="absolute inset-0 marina-gradient opacity-[0.07]" />
      <MarinaPattern className="opacity-40" opacity={0.06} />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-primary">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Anchor className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold">Rhode River Marina</span>
        </Link>
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
