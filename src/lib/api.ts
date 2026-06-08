/**
 * Backend API klienti — `/api/admin/` endpointlariga JWT bilan murojaat.
 *
 * Token saqlanishi: localStorage (`jojo_admin_token` + `jojo_admin_refresh`).
 * 401 holatida avtomatik refresh urinishi; muvaffaqiyatsiz bo'lsa login
 * sahifasiga o'tkazadi (auth context shu yerga ulanadi).
 */

const API_BASE = "https://api.jojoapp.uz/api";

const TOKEN_KEY = "jojo_admin_token";
const REFRESH_KEY = "jojo_admin_refresh";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const r = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!r.ok) return null;
      const data = await r.json();
      const access = data.access as string | undefined;
      if (!access) return null;
      setTokens(access, data.refresh);
      return access;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** multipart/form-data uchun — `body` to'g'ridan-to'g'ri FormData bo'lsin. */
  multipart?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function api<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    if (opts.multipart) {
      body = opts.body as FormData;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
  }
  let token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body,
    signal: opts.signal,
  });

  // 401 — bir marta refresh urinib ko'ramiz.
  if (response.status === 401) {
    const fresh = await tryRefresh();
    if (fresh) {
      headers.Authorization = `Bearer ${fresh}`;
      token = fresh;
      response = await fetch(url, {
        method: opts.method ?? "GET",
        headers,
        body,
        signal: opts.signal,
      });
    }
  }

  if (response.status === 204) return undefined as T;

  let payload: unknown = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await response.json().catch(() => null);
  } else if (contentType.startsWith("text/")) {
    payload = await response.text().catch(() => "");
  }

  if (!response.ok) {
    const message =
      (payload as { detail?: string } | null)?.detail ||
      `${response.status} ${response.statusText}`;
    const err: ApiError = {
      status: response.status,
      message,
      details: payload,
    };
    throw err;
  }

  return (payload as T) ?? (undefined as T);
}

/** Login — phone + password. JWT'larni store qiladi va profilini qaytaradi. */
export async function adminLogin(phone: string, password: string) {
  const data = await api<{
    access: string;
    refresh: string;
    user: {
      id: number;
      phone: string | null;
      username: string;
      full_name: string;
      is_superuser: boolean;
    };
  }>("/admin/login/", {
    method: "POST",
    body: { phone, password },
  });
  setTokens(data.access, data.refresh);
  return data.user;
}

/** Joriy admin profilini qaytaradi (token yaroqliligini tekshirish uchun). */
export async function adminMe() {
  return api<{
    id: number;
    phone: string | null;
    username: string;
    full_name: string;
    is_superuser: boolean;
  }>("/admin/me/");
}

export function adminLogout() {
  clearTokens();
}

/** Faylni yuklash — multipart/form-data. URL va path qaytaradi. */
export async function uploadMedia(
  file: File,
  folder:
    | "products"
    | "categories"
    | "banners"
    | "blog"
    | "blog/thumbnails"
    | "blog/banners"
    | "uploads" = "uploads",
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  return api<{ url: string; path: string; name: string; size: number }>(
    "/admin/upload/",
    {
      method: "POST",
      body: fd,
      multipart: true,
    },
  );
}
