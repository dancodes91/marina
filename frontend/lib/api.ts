import { marinaConfig } from "./marina";
import { clearTokens, getAccessToken, getApiBase, getRefreshToken, setTokens } from "./auth";
import { notifyAuthChanged } from "@/hooks/use-auth-session";

export type ApiError = { detail?: string | string[] };

const MARINA_SLUG = marinaConfig.slug;

async function refreshAccess(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  const res = await fetch(`${getApiBase()}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: rt }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = (await res.json()) as { access_token: string; refresh_token: string };
  setTokens(data.access_token, data.refresh_token);
  notifyAuthChanged();
  return data.access_token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...init } = options;
  let auth: string | null;
  if (Object.prototype.hasOwnProperty.call(options, "token")) {
    auth = token ?? null;
  } else {
    auth = getAccessToken();
  }
  const headers = new Headers(init.headers);
  headers.set("X-Marina-Slug", MARINA_SLUG);
  if (auth) headers.set("Authorization", `Bearer ${auth}`);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  let res = await fetch(`${getApiBase()}${path}`, { ...init, headers });
  if (res.status === 401 && auth) {
    const newTok = await refreshAccess();
    if (newTok) {
      headers.set("Authorization", `Bearer ${newTok}`);
      res = await fetch(`${getApiBase()}${path}`, { ...init, headers });
    }
  }
  if (!res.ok) {
    let err: ApiError = {};
    try {
      err = (await res.json()) as ApiError;
    } catch {
      err = { detail: res.statusText };
    }
    throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail ?? res.statusText));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: string; token?: string | null } = {}
): Promise<T> {
  const { token, method = "POST" } = options;
  let auth: string | null;
  if (Object.prototype.hasOwnProperty.call(options, "token")) {
    auth = token ?? null;
  } else {
    auth = getAccessToken();
  }
  const headers = new Headers();
  headers.set("X-Marina-Slug", MARINA_SLUG);
  if (auth) headers.set("Authorization", `Bearer ${auth}`);
  let res = await fetch(`${getApiBase()}${path}`, { method, headers, body: formData });
  if (res.status === 401 && auth) {
    const newTok = await refreshAccess();
    if (newTok) {
      headers.set("Authorization", `Bearer ${newTok}`);
      res = await fetch(`${getApiBase()}${path}`, { method, headers, body: formData });
    }
  }
  if (!res.ok) {
    let err: ApiError = {};
    try {
      err = (await res.json()) as ApiError;
    } catch {
      err = { detail: res.statusText };
    }
    throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail ?? res.statusText));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
