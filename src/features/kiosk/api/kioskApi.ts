import { kioskapi } from "../../../shared/api/apiClient";

export type KioskDeviceVerifyResponse = {
  IS_VALID: boolean | number;
  KIOSK_ID?: number;
  KIOSK_CODE?: string;
};

export type KioskTradeVerifyResponse = {
  TRADE_ID: number;
  PRODUCT_ID: number;
  TITLE: string;
  STATUS_CODE: string;
  TRADE_TYPE_CODE: string;
  LOCKER_ID?: number;
  LOCKER_NAME?: string;
};

export type KioskSellerProduct = {
  TRADE_ID?: number;
  PRODUCT_ID: number;
  TITLE: string;
  BASE_PRICE: number;
  PRODUCT_STATUS_CODE?: string;
  TRADE_STATUS_CODE?: string;
  CREATED_AT?: string;
  IMAGE_URL?: string | null;
};

export type KioskSellerLockerAssignResponse = {
  TRADE_ID?: number;
  PRODUCT_ID?: number;
  LOCKER_ID: number;
  LOCKER_NO?: number;
  LOCKER_STATUS_CODE?: string;
  LOCKER_STATUS_NAME?: string;
};

function unwrapFirst<T>(data: T | T[]): T {
  return Array.isArray(data) ? data[0] : data;
}

export const kioskApi = {
  verifyDevice(code: string) {
    return kioskapi(`/verify?CODE=${encodeURIComponent(code)}`, {
      method: "GET",
    }) as Promise<KioskDeviceVerifyResponse>;
  },

  verifyTrade(tradeCode: string) {
    return kioskapi(`/trade/verify?CODE=${encodeURIComponent(tradeCode)}`, {
      method: "GET",
    }) as Promise<KioskTradeVerifyResponse>;
  },

  openLocker(tradeId: number) {
    return kioskapi("/locker/open", {
      method: "POST",
      json: {
        TRADE_ID: tradeId,
      },
    });
  },

  checkLockerClosed(tradeId: number) {
    return kioskapi("/locker/close-check", {
      method: "POST",
      json: {
        TRADE_ID: tradeId,
      },
    });
  },

  async selectSellerProducts(body: {
    AUTH_CODE: string;
    KIOSK_CODE: string;
  }): Promise<KioskSellerProduct[]> {
    const query = new URLSearchParams();

    query.set("AUTH_CODE", body.AUTH_CODE);
    query.set("KIOSK_CODE", body.KIOSK_CODE);

    const res = await kioskapi(`/seller/product?${query.toString()}`, {
      method: "GET",
    });

    if (!res) return [];

    return Array.isArray(res) ? res : [res];
  },

  async assignSellerLocker(body: {
    AUTH_CODE: string;
    PRODUCT_ID: number;
    KIOSK_CODE: string;
  }): Promise<KioskSellerLockerAssignResponse> {
    const query = new URLSearchParams();

    query.set("AUTH_CODE", body.AUTH_CODE);
    query.set("PRODUCT_ID", String(body.PRODUCT_ID));
    query.set("KIOSK_CODE", body.KIOSK_CODE);

    const res = await kioskapi(`/seller/locker?${query.toString()}`, {
      method: "GET",
    });

    const result = unwrapFirst<KioskSellerLockerAssignResponse>(res);

    if (!result?.LOCKER_ID) {
      throw new Error("배정 가능한 보관함이 없습니다.");
    }

    return result;
  },
};
