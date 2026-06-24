"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, LogOut, Menu } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

interface SiteHeaderProps {
  title?: string;
  subtitle?: string;
  items?: NavItem[];
  cta?: { href: string; label: string };
  variant?: "light" | "dark";
  session?: AuthSession | null;
  onSignOut?: () => void;
}

const DEFAULT_NAV: NavItem[] = [
  { href: "/availability", label: "Slips & storage" },
  { href: "/login", label: "Sign in" },
];

function NavLinks({
  items,
  pathname,
  onNavigate,
  dark,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  dark?: boolean;
}) {
  return (
    <>
      {items.map((item) => {
        const active =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.split("?")[0]));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative text-sm font-medium transition-colors duration-200",
              dark
                ? active
                  ? "text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-marina-teal"
                  : "text-white/70 hover:text-white"
                : active
                  ? "text-foreground after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-accent"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function SiteHeader({
  title = "Rhode River Marina",
  subtitle,
  items = DEFAULT_NAV,
  cta = { href: "/requests/new?form_type=GENERAL", label: "Start work order →" },
  variant = "light",
  session = null,
  onSignOut,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dark = variant === "dark";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl transition-colors",
        dark
          ? "border-white/10 bg-marina-ink/80 text-white"
          : "border-border/50 bg-background/85"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
              dark ? "bg-white/10 text-white" : "bg-primary/8 text-primary group-hover:bg-primary/12"
            )}
          >
            <Anchor className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-semibold tracking-tight sm:text-base",
                dark ? "text-white" : "text-foreground"
              )}
            >
              {title}
            </p>
            {subtitle && (
              <p className={cn("hidden truncate text-xs sm:block", dark ? "text-white/60" : "text-muted-foreground")}>
                {subtitle}
              </p>
            )}
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLinks items={items} pathname={pathname} dark={dark} />
          {cta && (
            <Link
              href={cta.href}
              className={cn(
                "text-sm font-semibold transition-colors",
                dark ? "text-marina-teal hover:text-white" : "text-accent hover:text-primary"
              )}
            >
              {cta.label}
            </Link>
          )}
          {session && onSignOut && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{session.initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[140px] truncate text-sm font-medium lg:inline">
                    {session.email ?? session.displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.displayName}</p>
                    {session.email && (
                      <p className="text-xs leading-none text-muted-foreground">{session.email}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg md:hidden",
                dark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-6">
              <NavLinks items={items} pathname={pathname} onNavigate={() => setOpen(false)} />
              {cta && (
                <Link
                  href={cta.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-semibold text-accent"
                >
                  {cta.label}
                </Link>
              )}
              {session && onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSignOut();
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out ({session.initials})
                </button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
