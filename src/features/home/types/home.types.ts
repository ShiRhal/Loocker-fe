export type SortType = "latest" | "recommended" | "priceAsc" | "priceDesc";

export type SearchFilterValue = {
  keyword: string;
  minPrice: string;
  maxPrice: string;
  isLocker: boolean;
  excludeSold: boolean;
  sort: SortType;
  mainCategory: string;
  subCategory: string;
  stateName: string;
  cityName: string;
};

export type ProductItem = {
  id: number;
  title: string;
  price: number;
  location: string;
  createdText: string;
  likeCount: number;
  chatCount: number;
  isLockerTrade: boolean;
  imageUrl: string;
};

export type PriceStats = {
  totalCount: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
};

export type HomeSortType = "TIME" | "LIKE" | "MIN" | "MAX";

export type HomeSearchRequest = {
  DS_MAIN_CATEGORY: string;
  DS_SUB_CATEGORY: string;
  MIN_PRICE: number | null;
  MAX_PRICE: number | null;
  DS_STATE: string;
  DS_CITY: string;
  YN_SOLDED: boolean;
  YN_LOCKER: boolean;
  DS_TITLE: string;
  SORT_TYPE: HomeSortType;
  USER_ID: number;
  PAGE: number;
};

export type HomeProductResponseItem = {
  PRODUCT_ID: number;
  IMAGE_URL: string;
  BASE_PRICE: number;
  CITY: string;
  TITLE: string;
  CHAT_COUNT: number;
  WISH_COUNT: number;
  CREATED_AT: string;
  YN_LOCKER: boolean;
};

export type HomePriceStatusResponse = {
  PRODUCT_COUNT: number;
  AVG_PRICE: number;
  MIN_PRICE: number;
  MAX_PRICE: number;
};

export type HomeSearchResponse = {
  PRICE_STATUS: HomePriceStatusResponse;
  PRODUCT_LIST: HomeProductResponseItem[];
};