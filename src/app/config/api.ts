const API_BASE =
  process.env.REACT_APP_API_BASE_URL?.trim() || "http://localhost:8080";

type ApiOptions = RequestInit & { json?: any };

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
