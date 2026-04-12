const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8080";

type ApiOptions = RequestInit & { json?: any };

export async function api(path: string, options: ApiOptions = {}) {
  const { json, headers, ...rest } = options;
  const accessToken = localStorage.getItem("accessToken");

  const res = await fetch(`${API_BASE}${path}`, {
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
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || `API Error: ${res.status}`;
    throw new Error(message);
  }

  return data;
}