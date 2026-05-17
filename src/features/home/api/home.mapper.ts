import { toApiAssetUrl } from "../../../shared/utils/imageUrl";
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

function formatAbsoluteDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
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

  if (diffMs < 0) {
    return formatAbsoluteDate(targetDate);
  }

  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;

  const diffMinutes = Math.floor(diffMs / minute);
  const diffHours = Math.floor(diffMs / hour);
  const diffDays = Math.floor(diffMs / day);

  if (diffMs < hour) {
    return `${Math.max(1, diffMinutes)}분 전`;
  }

  if (diffMs < day) {
    return `${Math.max(1, diffHours)}시간 전`;
  }

  if (diffMs < day * 2) {
    return "하루 전";
  }

  if (diffDays < 30) {
    if (
      diffDays === 7 ||
      diffDays === 14 ||
      diffDays === 21 ||
      diffDays === 28
    ) {
      return `${diffDays / 7}주 전`;
    }

    return `${diffDays}일 전`;
  }

  return formatAbsoluteDate(targetDate);
}

function isWishedValue(value?: boolean | number) {
  return value === true || value === 1;
}

export function toHomeSearchRequest(
  filters: SearchFilterValue,
  page: number,
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
    PAGE: page,
  };
}

export function toPriceStats(priceStatus: HomePriceStatusResponse): PriceStats {
  return {
    totalCount: priceStatus.PRODUCT_COUNT,
    avgPrice: priceStatus.AVG_PRICE,
    minPrice: priceStatus.MIN_PRICE,
    maxPrice: priceStatus.MAX_PRICE,
  };
}

export function toProductItem(product: HomeProductResponseItem): ProductItem {
  return {
    id: product.PRODUCT_ID,
    title: product.TITLE,
    price: product.BASE_PRICE,
    location: product.CITY,
    createdText: formatCreatedText(product.CREATED_AT),
    likeCount: product.WISH_COUNT,
    chatCount: product.CHAT_COUNT,
    isLockerTrade: product.LOCKER_BADGE === "LOCKER",
    imageUrl: product.IMAGE_URL ? toApiAssetUrl(product.IMAGE_URL) : "",
    isWished: isWishedValue(product.IS_WISHED),
    statusCode: product.STATUS_CODE,
  };
}

export function toProductItems(
  products: HomeProductResponseItem[],
): ProductItem[] {
  return products.map(toProductItem);
}