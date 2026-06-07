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

  /**
   * 지도에서 처음 지점 선택할 때 사용하는 전체 지점 목록 조회 API
   * 선택 이력이 없어도 호출 가능해야 하는 API
   */
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

  /**
   * 이미 선택된 보관함 지점 조회 API
   * 지점 선택 이후, 보관대기 화면에서 사용
   * 선택 이력이 없으면 백에서 "지점을 선택한 이력이 없는 거래입니다." 발생 가능
   */
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
};
