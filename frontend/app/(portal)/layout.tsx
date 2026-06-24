"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

import { SiteHeader, type NavItem } from "@/components/layout/SiteHeader";
import { WaveDivider } from "@/components/layout/WaveDivider";
import { clearTokens, getAccessToken, isStaffToken } from "@/lib/auth";

const NAV: NavItem[] = [
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        title="Customer Portal"
        subtitle="Rhode River Marina"
        items={NAV}
        cta={{ href: "/requests/new?form_type=GENERAL", label: "New request →" }}
      />
      <div className="border-b border-border/40 bg-muted/30 px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl justify-end">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
      <WaveDivider variant="sand" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
