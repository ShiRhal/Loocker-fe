import { webapi } from "../../../shared/api/apiClient";
import type {
  PaymentCreateRequest,
  PaymentUpdateRequest,
  ProductDetailResponse,
  ProductTradePreview,
  TradeCreateRequest,
  TradeDetailResponse,
  TradeLockerLocationRequest,
  TradeLockerLocationResponse,
  TradeLockerLocationSelectRequest,
  TradeLockerStateRequest,
  TradeLockerStateResponse,
  TradeUpdateRequest,
  TradeUpdateResponse,
} from "../types/trade.types";

export type TradeLockerImageRequest = {
  TRADE_ID: number;
  USER_ID?: number;
};

export type TradeLockerImageResponse = {
  TRADE_ID?: number;
  LOCKER_ID?: number;

  SELLER_IMAGE_URL?: string | null;
  BUYER_IMAGE_URL?: string | null;

  sellerImageUrl?: string | null;
  buyerImageUrl?: string | null;

  IMAGE_TYPE_CODE?: string | null;
  IMAGE_URL?: string | null;

  imageTypeCode?: string | null;
  imageUrl?: string | null;
};

function getPrimaryImage(images: ProductDetailResponse["IMAGE"]) {
  if (!images || images.length === 0) return "";

  const primaryImage = images.find((image) => image.IS_PRIMARY);
  return primaryImage?.IMAGE_URL ?? images[0].IMAGE_URL ?? "";
}

function makeQuery(params: Record<string, string | number | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    searchParams.set(key, String(value));
  });

  return searchParams.toString();
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
    const query = makeQuery({
      PRODUCT_ID: productId,
      USER_ID: 0,
    });

    return await webapi(`/trade/id/select?${query}`, {
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

  async getTradeLockerLocationList(
    accessToken: string,
  ): Promise<TradeLockerLocationResponse[]> {
    return await webapi("/trade/locker/location/list/select", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async getTradeLockerLocation(
    accessToken: string,
    body: TradeLockerLocationSelectRequest,
  ): Promise<TradeLockerLocationResponse[]> {
    const query = makeQuery({
      TRADE_ID: body.TRADE_ID,
      USER_ID: body.USER_ID ?? 0,
    });

    return await webapi(`/trade/locker/location/select?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async createTradeLockerLocation(
    accessToken: string,
    body: TradeLockerLocationRequest,
  ): Promise<TradeLockerLocationResponse[]> {
    return await webapi("/trade/locker/location/create", {
      method: "POST",
      body: JSON.stringify({
        TRADE_ID: body.TRADE_ID,
        KIOSK_ID: body.KIOSK_ID,
        USER_ID: body.USER_ID ?? 0,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async updateTradeLockerLocation(
    accessToken: string,
    body: TradeLockerLocationRequest,
  ): Promise<TradeLockerLocationResponse[]> {
    return await webapi("/trade/locker/location/update", {
      method: "POST",
      body: JSON.stringify({
        TRADE_ID: body.TRADE_ID,
        KIOSK_ID: body.KIOSK_ID,
        USER_ID: body.USER_ID ?? 0,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async getTradeLockerStateList(
    accessToken: string,
    body: TradeLockerStateRequest,
  ): Promise<TradeLockerStateResponse[]> {
    const query = makeQuery({
      KIOSK_ID: body.KIOSK_ID,
    });

    return await webapi(`/trade/locker/state/select?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async getTradeLockerImages(
    accessToken: string,
    body: TradeLockerImageRequest,
  ): Promise<TradeLockerImageResponse | TradeLockerImageResponse[] | null> {
    const query = makeQuery({
      TRADE_ID: body.TRADE_ID,
      USER_ID: body.USER_ID ?? 0,
    });

    return await webapi(`/trade/locker/img/select?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};
