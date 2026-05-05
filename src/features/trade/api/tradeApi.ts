import { webapi } from "../../../app/config/api";
import type {
  PaymentCreateRequest,
  PaymentUpdateRequest,
  ProductDetailResponse,
  ProductTradePreview,
  TradeCreateRequest,
  TradeUpdateRequest,
} from "../types/trade.types";

function getPrimaryImage(images: ProductDetailResponse["IMAGE"]) {
  if (!images || images.length === 0) return "";

  const primaryImage = images.find((image) => image.IS_PRIMARY);
  return primaryImage?.IMAGE_URL ?? images[0].IMAGE_URL ?? "";
}

export const tradeApi = {
  async getProductTradePreview(
    productId: number,
  ): Promise<ProductTradePreview> {
    const res = await webapi(`/product/detail/select?PRODUCT_ID=${productId}`, {
      method: "GET",
    });

    const detail: ProductDetailResponse = Array.isArray(res) ? res[0] : res;

    return {
      productId: detail.PRODUCT_ID,
      title: detail.TITLE,
      imageUrl: getPrimaryImage(detail.IMAGE),
      expectedPrice: detail.BASE_PRICE,
      tradeType: detail.TRADE_TYPE,
    };
  },

  async createTrade(accessToken: string, body: TradeCreateRequest) {
    return await webapi("/trade/create", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async getTradeId(accessToken: string, productId: number) {
    return await webapi(`/trade/id/select?PRODUCT_ID=${productId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async updateTradeStatus(accessToken: string, body: TradeUpdateRequest) {
    return await webapi("/trade/update", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async createPayment(accessToken: string, body: PaymentCreateRequest) {
    return await webapi("/payment/create", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async updatePayment(accessToken: string, body: PaymentUpdateRequest) {
    return await webapi("/payment/paid/update", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};
