"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearTokens, getAccessToken, isStaffToken } from "@/lib/auth";

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
      <div className="flex min-h-screen items-center justify-center text-slate-600">Loading…</div>
    );
  }

  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/requests/new", label: "New request" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-semibold text-slate-900">
            Marina Portal
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={pathname === n.href ? "font-medium text-blue-700" : "text-slate-600 hover:text-slate-900"}
              >
                {n.label}
              </Link>
            ))}
            <button type="button" onClick={logout} className="text-slate-600 hover:text-slate-900">
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
