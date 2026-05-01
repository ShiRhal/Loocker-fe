export type TradeTab = "DELIVERY" | "DIRECT" | "LOCKER";

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
  | "CANCELED";

export type TradeCreateRequest = {
  PRODUCT_ID: number;
  TRADE_TYPE_CODE: TradeTab;
  CHAT_ROOM_ID: number;
  TRADE_ID: number;
};

export type TradeIdSelectResponse = {
  TRADE_ID: number;
};

export type TradeUpdateRequest = {
  TRADE_ID: number;
  NEXT_STATUS_CODE: NextTradeStatus;
  TRADE_TYPE_CODE: Exclude<TradeTab, "LOCKER">;
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
