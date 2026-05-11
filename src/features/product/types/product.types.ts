export type ProductFormMode = "create" | "edit";

export type ProductImage = {
  IMAGE_ID: number;
  PRODUCT_ID: number;
  IMAGE_URL: string;
  IS_PRIMARY: boolean | number;
  SORT_ORDER: number;
  CREATED_AT: string;
};

export type ProductDetail = {
  PRODUCT_ID: number;
  TITLE: string;
  DESCRIPTION: string;
  BASE_PRICE: number;
  IMAGE?: ProductImage[];
  ACCESSORY_STATUS?: string;
  TRADE_TYPE?: string;
  STATE?: string | null;
  CITY?: string | null;
  MAIN_CATEGORY?: string;
  SUB_CATEGORY?: string;
  STATUS_CODE?: string;
  VIEW_COUNT?: number;
  WISH_COUNT?: number;
  CHAT_COUNT?: number;
  CREATED_AT?: string;
  NICKNAME?: string;
};