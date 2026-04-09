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

//추후 상대 시간으로 변경해야함.
function formatCreatedText(createdAt: string): string {
  if (!createdAt) {
    return "";
  }

  return createdAt;
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
    YN_SOLDED: !filters.excludeSold,
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
    isLockerTrade: product.YN_LOCKER,
    imageUrl: product.IMAGE_URL,
  };
}

export function toProductItems(
  products: HomeProductResponseItem[]
): ProductItem[] {
  return products.map(toProductItem);
}