import { API_BASE } from "../api/apiClient";

export function toApiAssetUrl(path?: string | null): string {
  if (!path) {
    return "";
  }

  const normalizedPath = path.trim();

  if (!normalizedPath) {
    return "";
  }

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://") ||
    normalizedPath.startsWith("data:") ||
    normalizedPath.startsWith("blob:")
  ) {
    return normalizedPath;
  }

  const base = API_BASE.replace(/\/+$/, "");
  const assetPath = normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;

  return `${base}${assetPath}`;
}