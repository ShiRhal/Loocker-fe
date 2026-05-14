import { webapi } from "../../../shared/api/apiClient";
import type {
  PaymentCreateRequest,
  PaymentUpdateRequest,
  ProductDetailResponse,
  ProductTradePreview,
  TradeCreateRequest,
  TradeDetailResponse,
  TradeUpdateRequest,
  TradeUpdateResponse,
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

  async getTradeDetail(
    accessToken: string,
    productId: number,
  ): Promise<TradeDetailResponse | null> {
    const res = await webapi(`/trade/select?PRODUCT_ID=${productId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res) return null;

    const detail = Array.isArray(res) ? res[0] : res;

    if (!detail || !detail.TRADE_ID) return null;

    return detail as TradeDetailResponse;
  },

  async updateTradeStatus(
    accessToken: string,
    body: TradeUpdateRequest,
  ): Promise<TradeUpdateResponse> {
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

  async updatePaymentPaid(accessToken: string, body: PaymentUpdateRequest) {
    return await webapi("/payment/paid/update", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async updatePaymentCancel(accessToken: string, body: PaymentUpdateRequest) {
    return await webapi("/payment/cancel/update", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async updateTradeStatusWithoutAuth(
    body: TradeUpdateRequest,
  ): Promise<TradeUpdateResponse> {
    return await webapi("/trade/update", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
};
