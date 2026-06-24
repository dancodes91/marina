const ACCESS = "msp_access";
const REFRESH = "msp_refresh";
const USER_EMAIL = "msp_user_email";

export type AuthSession = {
  isAuthenticated: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  email: string | null;
  displayName: string;
  initials: string;
};

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH);
}

export function setTokens(access: string, refresh: string, email?: string | null) {
  localStorage.setItem(ACCESS, access);
  localStorage.setItem(REFRESH, refresh);
  const resolved = email ?? getEmailFromToken(access);
  if (resolved) {
    localStorage.setItem(USER_EMAIL, resolved);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(USER_EMAIL);
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isStaffToken(token: string | null): boolean {
  if (!token) return false;
  const p = decodeJwtPayload(token);
  return p?.typ === "staff";
}

export function getEmailFromToken(token: string | null): string | null {
  if (!token) return null;
  const email = decodeJwtPayload(token)?.email;
  return typeof email === "string" && email.includes("@") ? email : null;
}

export function getStoredUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(USER_EMAIL);
  if (stored && stored.includes("@")) return stored;
  return getEmailFromToken(getAccessToken());
}

export function getInitialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function getAuthSession(): AuthSession | null {
  const token = getAccessToken();
  if (!token) return null;

  const isStaff = isStaffToken(token);
  const email = getEmailFromToken(token) ?? getStoredUserEmail();
  const displayName = email ?? (isStaff ? "Manager" : "Customer");

  return {
    isAuthenticated: true,
    isStaff,
    isCustomer: !isStaff,
    email,
    displayName,
    initials: email ? getInitialsFromEmail(email) : isStaff ? "MG" : "CU",
  };
}
