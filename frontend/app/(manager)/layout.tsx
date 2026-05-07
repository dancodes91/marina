"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearTokens, getAccessToken, isStaffToken } from "@/lib/auth";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = getAccessToken();
    if (!t || !isStaffToken(t)) {
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
      <div className="flex min-h-screen items-center justify-center text-slate-600">Loading…</div>
    );
  }

  const nav = [
    { href: "/manager/requests", label: "Requests" },
    { href: "/manager/labor-codes", label: "Labor codes" },
    { href: "/manager/sync", label: "Wallace sync" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="font-semibold">Service Manager</span>
          <nav className="flex items-center gap-4 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={pathname?.startsWith(n.href) ? "font-medium text-white" : "text-slate-300 hover:text-white"}
              >
                {n.label}
              </Link>
            ))}
            <button type="button" onClick={logout} className="text-slate-300 hover:text-white">
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
