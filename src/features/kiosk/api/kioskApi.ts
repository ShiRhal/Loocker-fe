import { api } from "../../../app/config/api";

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

export const kioskApi = {
  verifyDevice(code: string) {
    return api(`/kiosk/verify?CODE=${encodeURIComponent(code)}`, {
      method: "GET",
    }) as Promise<KioskDeviceVerifyResponse>;
  },

  verifyTrade(tradeCode: string) {
    return api(`/kiosk/trade/verify?CODE=${encodeURIComponent(tradeCode)}`, {
      method: "GET",
    }) as Promise<KioskTradeVerifyResponse>;
  },

  openLocker(tradeId: number) {
    return api(`/kiosk/locker/open`, {
      method: "POST",
      json: {
        TRADE_ID: tradeId,
      },
    });
  },

  checkLockerClosed(tradeId: number) {
    return api(`/kiosk/locker/close-check`, {
      method: "POST",
      json: {
        TRADE_ID: tradeId,
      },
    });
  },
};
