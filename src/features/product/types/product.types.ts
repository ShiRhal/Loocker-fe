export type ProductFormMode = "create" | "edit";

export type ProductImage = {
  PRODUCT_ID: number;
  CREATED_AT: string;
  SORT_ORDER: number;
  IMAGE_URL: string;
  IS_PRIMARY: boolean | number;
  IMAGE_ID: number;
};

export type ProductDetail = {
  PRODUCT_ID: number;
  CREATED_AT?: string;
  SELLER_ID: number,
  IMAGE?: ProductImage[];
  ACCESSORY_STATUS?: string;
  STATE?: string | null;
  CITY?: string | null;
  TITLE: string;
  BASE_PRICE: number;
  SUB_CATEGORY?: string;
  MAIN_CATEGORY?: string;
  DESCRIPTION: string;
  NICKNAME?: string;
  TRADE_TYPE?: string;
  CHAT_COUNT?: number;
  STATUS_CODE?: string;
  VIEW_COUNT?: number;
  WISH_COUNT?: number;
  IS_WISHED?: boolean | number;
};