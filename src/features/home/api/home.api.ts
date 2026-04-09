import { api } from "../../../app/config/api";
import type {
  HomeSearchRequest,
  HomeSearchResponse,
} from "../types/home.types";

function toQueryString(params: HomeSearchRequest): string {
  const searchParams = new URLSearchParams();

  if (params.DS_MAIN_CATEGORY) {
    searchParams.set("DS_MAIN_CATEGORY", params.DS_MAIN_CATEGORY);
  }

  if (params.DS_SUB_CATEGORY) {
    searchParams.set("DS_SUB_CATEGORY", params.DS_SUB_CATEGORY);
  }

  if (params.MIN_PRICE !== null) {
    searchParams.set("MIN_PRICE", String(params.MIN_PRICE));
  }

  if (params.MAX_PRICE !== null) {
    searchParams.set("MAX_PRICE", String(params.MAX_PRICE));
  }

  if (params.DS_STATE) {
    searchParams.set("DS_STATE", params.DS_STATE);
  }

  if (params.DS_CITY) {
    searchParams.set("DS_CITY", params.DS_CITY);
  }

  searchParams.set("YN_SOLDED", String(params.YN_SOLDED));
  searchParams.set("YN_LOCKER", String(params.YN_LOCKER));

  if (params.DS_TITLE) {
    searchParams.set("DS_TITLE", params.DS_TITLE);
  }

  searchParams.set("SORT_TYPE", params.SORT_TYPE);
  searchParams.set("USER_ID", String(params.USER_ID));
  searchParams.set("PAGE", String(params.PAGE));

  return searchParams.toString();
}

export async function searchHomeProducts(
  request: HomeSearchRequest
): Promise<HomeSearchResponse> {
  const queryString = toQueryString(request);

  const data = await api(
    `/product/select?${queryString}`,
    {
      method: "GET",
    }
  );

  return data as HomeSearchResponse;
}