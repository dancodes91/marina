"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CustomerSidebar } from "@/components/layout/customer-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { notifyAuthChanged } from "@/hooks/use-auth-session";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { clearTokens, getAccessToken, isStaffToken } from "@/lib/auth";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
    notifyAuthChanged();
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <CustomerSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader variant="customer" onSignOut={logout} />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
