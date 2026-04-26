import { api } from "../../../app/config/api";

type CreateTradeReq = {
  PRODUCT_ID: number;
  TRADE_TYPE_CODE: "DELIVERY" | "DIRECT" | "LOCKER";
  TRADE_ID: number;
};

export const tradeApi = {
  async getProductTradePreview(productId: number) {
    return {
      productId,
      title: "더미데이터",
      imageUrl: "",
      expectedPrice: 30000,
    };
  },

  async createTrade(accessToken: string, body: CreateTradeReq) {
    return await api("/trade/create", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};
