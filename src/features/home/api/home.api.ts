import { webapi } from "../../../shared/api/apiClient";
import type {
  HomeSearchRequest,
  HomeSearchResponse,
} from "../types/home.types";

function getSafeUserId(userId?: number | null): number {
  if (typeof userId === "number" && !Number.isNaN(userId)) {
    return userId;
  }

  const savedUserId = localStorage.getItem("userId");
  const parsedUserId = savedUserId ? Number(savedUserId) : 0;

  return Number.isNaN(parsedUserId) ? 0 : parsedUserId;
}

function toQueryString(params: HomeSearchRequest): string {
  const searchParams = new URLSearchParams();

  searchParams.set("DS_MAIN_CATEGORY", params.DS_MAIN_CATEGORY ?? "");
  searchParams.set("DS_SUB_CATEGORY", params.DS_SUB_CATEGORY ?? "");
  searchParams.set(
    "MIN_PRICE",
    params.MIN_PRICE === null ? "" : String(params.MIN_PRICE),
  );
  searchParams.set(
    "MAX_PRICE",
    params.MAX_PRICE === null ? "" : String(params.MAX_PRICE),
  );
  searchParams.set("DS_STATE", params.DS_STATE ?? "");
  searchParams.set("DS_CITY", params.DS_CITY ?? "");
  searchParams.set("YN_SOLDED", String(params.YN_SOLDED));
  searchParams.set("YN_LOCKER", String(params.YN_LOCKER));
  searchParams.set("DS_TITLE", params.DS_TITLE ?? "");
  searchParams.set("SORT_TYPE", params.SORT_TYPE);
  searchParams.set("USER_ID", String(getSafeUserId(params.USER_ID)));
  searchParams.set("PAGE", String(params.PAGE));

  return searchParams.toString();
}

export async function searchHomeProducts(
  request: HomeSearchRequest,
): Promise<HomeSearchResponse> {
  const queryString = toQueryString(request);
  const path = `/product/select?${queryString}`;

  const data = await webapi(path, {
    method: "GET",
  });

  return data as HomeSearchResponse;
}