"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiFetch } from "@/lib/api";
import { marinaConfig } from "@/lib/marina";

type MarinaBranding = {
  name: string;
  subtitle: string;
  slug: string;
};

type MarinaBrandingContextValue = MarinaBranding & {
  refresh: () => Promise<void>;
};

const defaultBranding: MarinaBranding = {
  name: marinaConfig.name,
  subtitle: marinaConfig.subtitle,
  slug: marinaConfig.slug,
};

const MarinaBrandingContext = createContext<MarinaBrandingContextValue | null>(null);

export function MarinaBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<MarinaBranding>(defaultBranding);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<MarinaBranding>("/api/v1/marina/branding", { token: null });
      setBranding(data);
    } catch {
      setBranding(defaultBranding);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...branding,
      refresh,
    }),
    [branding, refresh]
  );

  return <MarinaBrandingContext.Provider value={value}>{children}</MarinaBrandingContext.Provider>;
}

export function useMarinaBranding() {
  const context = useContext(MarinaBrandingContext);
  if (!context) {
    return {
      ...defaultBranding,
      refresh: async () => {},
    };
  }
  return context;
}
