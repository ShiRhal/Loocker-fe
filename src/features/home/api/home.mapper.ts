import type {
  HomePriceStatusResponse,
  HomeProductResponseItem,
  HomeSearchRequest,
  HomeSortType,
  PriceStats,
  ProductItem,
  SearchFilterValue,
  SortType,
} from "../types/home.types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8080";

function mapSortType(sort: SortType): HomeSortType {
  switch (sort) {
    case "latest":
      return "TIME";
    case "recommended":
      return "LIKE";
    case "priceAsc":
      return "MIN";
    case "priceDesc":
      return "MAX";
    default:
      return "TIME";
  }
}

function toNullableNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function formatCreatedText(createdAt: string): string {
  if (!createdAt) {
    return "";
  }

  const normalized = createdAt.replace(" ", "T");
  const targetDate = new Date(normalized);

  if (Number.isNaN(targetDate.getTime())) {
    return createdAt;
  }

  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();

  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;

  if (diffMs < minute) {
    return "방금 전";
  }

  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)}분 전`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}시간 전`;
  }

  if (diffMs < day * 7) {
    return `${Math.floor(diffMs / day)}일 전`;
  }

  return createdAt.slice(0, 10);
}

function toImageUrl(imageUrl: string | null): string {
  if (!imageUrl) {
    return "";
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return `${API_BASE_URL}${imageUrl}`;
}

export function toHomeSearchRequest(
  filters: SearchFilterValue,
  page: number
): HomeSearchRequest {
  return {
    DS_MAIN_CATEGORY: filters.mainCategory,
    DS_SUB_CATEGORY: filters.subCategory,
    MIN_PRICE: toNullableNumber(filters.minPrice),
    MAX_PRICE: toNullableNumber(filters.maxPrice),
    DS_STATE: filters.stateName,
    DS_CITY: filters.cityName,
    YN_SOLDED: filters.excludeSold,
    YN_LOCKER: filters.isLocker,
    DS_TITLE: filters.keyword,
    SORT_TYPE: mapSortType(filters.sort),
    USER_ID: 0,
    PAGE: page,
  };
}

export function toPriceStats(
  priceStatus: HomePriceStatusResponse
): PriceStats {
  return {
    totalCount: priceStatus.PRODUCT_COUNT,
    avgPrice: priceStatus.AVG_PRICE,
    minPrice: priceStatus.MIN_PRICE,
    maxPrice: priceStatus.MAX_PRICE,
  };
}

export function toProductItem(
  product: HomeProductResponseItem
): ProductItem {
  return {
    id: product.PRODUCT_ID,
    title: product.TITLE,
    price: product.BASE_PRICE,
    location: product.CITY,
    createdText: formatCreatedText(product.CREATED_AT),
    likeCount: product.WISH_COUNT,
    chatCount: product.CHAT_COUNT,
    isLockerTrade: product.LOCKER_BADGE === "LOCKER",
    imageUrl: toImageUrl(product.IMAGE_URL),
  };
}

export function toProductItems(
  products: HomeProductResponseItem[]
): ProductItem[] {
  return products.map(toProductItem);
}