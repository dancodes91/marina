import { clearTokens, getAccessToken, getApiBase, getRefreshToken, setTokens } from "./auth";

export type ApiError = { detail?: string | string[] };

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
