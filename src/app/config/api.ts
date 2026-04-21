export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8080";

type ApiOptions = RequestInit & { json?: any };

export function toApiAssetUrl(path?: string | null): string {
  if (!path) return "";
  const normalizedPath = path.trim();
  if (!normalizedPath) return "";

  if (/^(https?:)?\/\//i.test(normalizedPath) || normalizedPath.startsWith("data:") || normalizedPath.startsWith("blob:")) {
    return normalizedPath;
  }

  const base = API_BASE.replace(/\/+$/, "");
  const relativePath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  return `${base}${relativePath}`;
}

export async function api(path: string, options: ApiOptions = {}) {
  const { json, headers, ...rest } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: "include", // ✅ HTTPOnly 쿠키 세션 쓰려면 필수
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: json ? JSON.stringify(json) : rest.body,
  });

  // 204 No Content 대응
  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || `API Error: ${res.status}`;
    throw new Error(message);
  }

  return data;
}
