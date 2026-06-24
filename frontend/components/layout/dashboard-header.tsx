"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
import { decodeJwtPayload, getAccessToken } from "@/lib/auth";
import { useSidebar } from "@/hooks/use-sidebar";

const titles: { match: string; title: string; exact?: boolean }[] = [
  { match: "/manager", title: "Dashboard", exact: true },
  { match: "/manager/requests", title: "Service Requests" },
  { match: "/manager/reservations", title: "Reservations" },
  { match: "/manager/labor-codes", title: "Labor Codes" },
  { match: "/manager/sync", title: "Wallace Sync" },
  { match: "/manager/notifications", title: "Notifications" },
];

function resolveTitle(pathname: string | null): string {
  if (!pathname) return "Manager";
  const exact = titles.find((t) => t.exact && pathname === t.match);
  if (exact) return exact.title;
  const prefix = titles.find((t) => !t.exact && pathname.startsWith(t.match));
  return prefix?.title ?? "Manager";
}

export function DashboardHeader({ onSignOut }: { onSignOut: () => void }) {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const title = resolveTitle(pathname);
  const [email, setEmail] = useState("Staff");

  useEffect(() => {
    const token = getAccessToken();
    const payload = token ? decodeJwtPayload(token) : null;
    setEmail((payload?.sub as string | undefined) ?? "Staff");
  }, []);

  const initials = email.slice(0, 2).toUpperCase();

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
            <span className="hidden max-w-[140px] truncate text-sm font-medium sm:inline">{email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Signed in</p>
              <p className="text-xs leading-none text-muted-foreground">{email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            Manager account
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
