"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Bell,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  RefreshCw,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";

const navItems = [
  { href: "/manager", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/manager/requests", label: "Requests", icon: ClipboardList },
  { href: "/manager/reservations", label: "Reservations", icon: Anchor },
  { href: "/manager/labor-codes", label: "Labor Codes", icon: Wrench },
  { href: "/manager/sync", label: "Wallace Sync", icon: RefreshCw },
  { href: "/manager/notifications", label: "Notifications", icon: Bell },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary-foreground/15 text-primary-foreground shadow-sm"
          : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className={cn("truncate transition-opacity", collapsed && "sr-only")}>{label}</span>
    </Link>
  );
}

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
      {navItems.map((item) => (
        <NavLink key={item.href} {...item} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function AppSidebar() {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-14 items-center border-b border-primary-foreground/10 px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary-foreground">Marina Service</p>
            <p className="truncate text-xs text-primary-foreground/60">Manager Console</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="hidden shrink-0 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground md:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>
      <SidebarNav collapsed={collapsed} />
      <div className="mt-auto border-t border-primary-foreground/10 p-3">
        <div
          className={cn(
            "rounded-md bg-primary-foreground/10 px-3 py-2 text-xs text-primary-foreground/80",
            collapsed && "px-2 text-center"
          )}
        >
          {collapsed ? "⚓" : "Rhode River Marina"}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen shrink-0 border-r border-border/60 marina-gradient transition-[width] duration-300 md:sticky md:top-0 md:flex md:flex-col",
          collapsed ? "w-[4.5rem]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-r-0 p-0 marina-gradient text-primary-foreground">
          <div className="flex h-full flex-col pt-2">
            <div className="px-4 pb-2">
              <p className="text-sm font-semibold">Marina Service</p>
              <p className="text-xs text-primary-foreground/60">Manager Console</p>
            </div>
            <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
