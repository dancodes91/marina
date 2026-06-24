"use client";

import { usePathname } from "next/navigation";
import { LogOut, Menu, User } from "lucide-react";

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
import { useAuthSession } from "@/hooks/use-auth-session";
import { useSidebar } from "@/hooks/use-sidebar";

const managerTitles: { match: string; title: string; exact?: boolean }[] = [
  { match: "/manager", title: "Dashboard", exact: true },
  { match: "/manager/requests", title: "Service Requests" },
  { match: "/manager/reservations", title: "Reservations" },
  { match: "/manager/labor-codes", title: "Labor Codes" },
  { match: "/manager/sync", title: "Wallace Sync" },
  { match: "/manager/notifications", title: "Notifications" },
];

const customerTitles: { match: string; title: string; exact?: boolean }[] = [
  { match: "/dashboard", title: "Dashboard", exact: true },
  { match: "/requests/new", title: "New Request" },
  { match: "/requests", title: "Request Details" },
  { match: "/reservations/new", title: "New Reservation" },
  { match: "/boats", title: "Boat Details" },
  { match: "/profile", title: "Profile", exact: true },
];

function resolveTitle(
  pathname: string | null,
  titles: { match: string; title: string; exact?: boolean }[],
  fallback: string
): string {
  if (!pathname) return fallback;
  const exact = titles.find((t) => t.exact && pathname === t.match);
  if (exact) return exact.title;
  const prefix = titles
    .filter((t) => !t.exact)
    .sort((a, b) => b.match.length - a.match.length)
    .find((t) => pathname.startsWith(t.match));
  return prefix?.title ?? fallback;
}

export function DashboardHeader({
  onSignOut,
  variant = "manager",
}: {
  onSignOut: () => void;
  variant?: "manager" | "customer";
}) {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const session = useAuthSession();
  const titles = variant === "customer" ? customerTitles : managerTitles;
  const title = resolveTitle(pathname, titles, variant === "customer" ? "Customer Portal" : "Manager");
  const displayName = session?.displayName ?? (variant === "customer" ? "Customer" : "Staff");
  const initials = session?.initials ?? (variant === "customer" ? "CU" : "MG");
  const accountLabel = variant === "customer" ? "Customer account" : "Manager account";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border/60 bg-card/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold text-primary">{title}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[180px] truncate text-sm font-medium sm:inline">{displayName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Signed in</p>
              <p className="text-xs leading-none text-muted-foreground">{displayName}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            {accountLabel}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
