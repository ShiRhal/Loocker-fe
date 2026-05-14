export type TradeTab = "DELIVERY" | "DIRECT" | "LOCKER";

export type TradeRole = "BUYER" | "SELLER";

export type TradeMethodOption = {
  id: TradeTab;
  title: string;
  description: string;
  feeLabel?: string;
};

export type ProductDetailImage = {
  IMAGE_ID: number;
  PRODUCT_ID: number;
  IMAGE_URL: string;
  IS_PRIMARY: boolean;
  SORT_ORDER: number;
  CREATED_AT: string;
};

export type ProductDetailResponse = {
  CITY: string;
  TITLE: string;
  IMAGE: ProductDetailImage[];
  STATE: string;
  ACCESSORY_STATUS: string;
  PRODUCT_ID: number;
  DESCRIPTION: string;
  BASE_PRICE: number;
  SUB_CATEGORY: string;
  NICKNAME: string;
  TRADE_TYPE: string;
  MAIN_CATEGORY: string;
  VIEW_COUNT: number;
  CREATED_AT: string;
  WISH_COUNT: number;
  CHAT_COUNT: number;
  STATUS_CODE: string;
};

export type ProductTradePreview = {
  productId: number;
  title: string;
  imageUrl: string;
  expectedPrice: number;
  tradeType: string;
};

export type NextTradeStatus =
  | "TRADING"
  | "PAID"
  | "FAILED"
  | "COMPLETED"
  | "CANCELED"
  | "ORDER_CHECK"
  | "SHIPPING"
  | "DELIVERED"
  | "PICKEDUP"
  | "DIRECT_IN_PROGRESS"
  | "DIRECT_RECEIVED";

export type TradeCreateRequest = {
  PRODUCT_ID: number;
  TRADE_TYPE_CODE: TradeTab;
  CHAT_ROOM_ID: number;
  TRADE_ID: number;
};

export type TradeIdSelectResponse = {
  TRADE_ID: number;
};

export type TradeDetailResponse = {
  TRADE_ID: number;
  PRODUCT_ID: number;
  TRADE_TYPE_CODE: TradeTab;
  STATUS_CODE: string;
  MY_ROLE: TradeRole;
};

export type TradeUpdateRequest = {
  TRADE_ID: number;
  RESULT_STATUS_CODE?: string;
  NEXT_STATUS_CODE: string;
  TRADE_TYPE_CODE: TradeTab;
  USER_ID?: number;
};

export type TradeUpdateResponse = {
  RESULT_STATUS_CODE?: string;
  STATUS_CODE?: string;
  NEXT_STATUS_CODE?: string;
  resultStatusCode?: string;
  statusCode?: string;
  nextStatusCode?: string;
};

export type PaymentCreateRequest = {
  PRODUCT_ID: number;
  TRADE_ID: number;
};

export type PaymentUpdateRequest = {
  TRADE_ID: number;
  AMOUNT: number;
  ORDER_ID: string;
  PAYMENT_KEY: string;
};
