"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu } from "lucide-react";

import { MarinaHeader } from "@/components/layout/MarinaHeader";
import { WaveDivider } from "@/components/layout/WaveDivider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { clearTokens, getAccessToken, isStaffToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/requests/new", label: "New request" },
  { href: "/reservations/new", label: "Reservation" },
  { href: "/availability", label: "Availability" },
  { href: "/profile", label: "Profile" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const t = getAccessToken();
    if (!t || isStaffToken(t)) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  function logout() {
    clearTokens();
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  const navLinks = (
    <>
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setSheetOpen(false)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === n.href || pathname.startsWith(n.href + "/")
              ? "bg-white/15 text-primary-foreground"
              : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
          )}
        >
          {n.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <MarinaHeader title="Customer Portal" subtitle="Rhode River Marina">
        <nav className="hidden items-center gap-1 md:flex">{navLinks}</nav>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-white/10 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">{navLinks}</nav>
          </SheetContent>
        </Sheet>
      </MarinaHeader>
      <WaveDivider variant="sand" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
