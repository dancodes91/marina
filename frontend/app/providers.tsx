"use client";

import { MarinaBrandingProvider } from "@/hooks/use-marina-branding";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <MarinaBrandingProvider>{children}</MarinaBrandingProvider>;
}
