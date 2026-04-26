export type TradeTab = "DELIVERY" | "DIRECT" | "LOCKER";

export type TradeMethodOption = {
  id: string;
  title: string;
  description: string;
  feeLabel?: string;
};

export type ProductTradePreview = {
  productId: number;
  title: string;
  imageUrl: string;
  expectedPrice: number;
};
