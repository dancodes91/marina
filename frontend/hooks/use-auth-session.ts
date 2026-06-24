"use client";

import { useEffect, useState } from "react";

import { type AuthSession, getAuthSession } from "@/lib/auth";

export function useAuthSession(): AuthSession | null {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const sync = () => setSession(getAuthSession());
    sync();

    window.addEventListener("storage", sync);
    window.addEventListener("msp-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("msp-auth-changed", sync);
    };
  }, []);

  return session;
}

export function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("msp-auth-changed"));
  }
}
