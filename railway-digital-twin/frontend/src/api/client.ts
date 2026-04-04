const DEFAULT_BASE = "http://localhost:8000";

export function getApiBaseUrl(): string {
  const v = import.meta.env.VITE_API_BASE_URL;
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return DEFAULT_BASE;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}
