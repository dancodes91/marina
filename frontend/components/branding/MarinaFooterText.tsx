"use client";

import { useMarinaBranding } from "@/hooks/use-marina-branding";

export function MarinaFooterText() {
  const { name } = useMarinaBranding();
  return (
    <>
      © {new Date().getFullYear()} {name} · Service Portal
    </>
  );
}
