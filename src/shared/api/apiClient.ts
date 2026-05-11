export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8080";

type ApiOptions = RequestInit & {
  json?: any;
};

export async function api(path: string, options: ApiOptions = {}) {
  const { json, headers, ...rest } = options;
  const accessToken = localStorage.getItem("accessToken");

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${API_BASE}${normalizedPath}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(headers || {}),
    },
    body: json ? JSON.stringify(json) : rest.body,
  });

  if (res.status === 204) return null;

  const text = await res.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || `API Error: ${res.status}`;

    throw new Error(message);
  }

  return data;
}

export function webapi(path: string, options?: ApiOptions) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return api(`/web${normalizedPath}`, options);
}

export function kioskapi(path: string, options?: ApiOptions) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return api(`/kiosk${normalizedPath}`, options);
}