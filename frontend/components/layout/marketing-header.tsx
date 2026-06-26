"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { SiteHeader, type NavItem } from "@/components/layout/SiteHeader";
import { notifyAuthChanged, useAuthSession } from "@/hooks/use-auth-session";
import { marinaConfig } from "@/lib/marina";
import { clearTokens } from "@/lib/auth";

interface MarketingHeaderProps {
  title?: string;
  subtitle?: string;
  guestCta?: { href: string; label: string };
}

export function MarketingHeader({
  title = marinaConfig.name,
  subtitle = marinaConfig.subtitle,
  guestCta,
}: MarketingHeaderProps) {
  const router = useRouter();
  const session = useAuthSession();

  let items: NavItem[];
  let cta: { href: string; label: string } | undefined;

  if (session?.isStaff) {
    items = [
      { href: "/manager", label: "Manager console" },
      { href: "/availability", label: "Availability" },
    ];
    cta = { href: "/manager/requests", label: "View requests →" };
  } else if (session?.isCustomer) {
    items = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/availability", label: "Availability" },
      { href: "/profile", label: "Profile" },
    ];
    cta = { href: "/requests/new?form_type=GENERAL", label: "New request →" };
  } else {
    items = [
      { href: "/availability", label: "Availability" },
      { href: "/login", label: "Sign in" },
      { href: "/claim", label: "Claim account" },
    ];
    cta = guestCta ?? { href: "/requests/new?form_type=GENERAL", label: "Start work order →" };
  }

  function signOut() {
    clearTokens();
    notifyAuthChanged();
    router.replace("/login");
  }

  return (
    <SiteHeader
      title={title}
      subtitle={subtitle}
      items={items}
      cta={cta}
      session={session}
      onSignOut={session ? signOut : undefined}
    />
  );
}
