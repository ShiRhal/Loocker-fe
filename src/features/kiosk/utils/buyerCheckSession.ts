export const BUYER_CHECK_AUTH_CODE_KEY = "buyerCheckAuthCode";
export const BUYER_CHECK_AUTH_SAVED_AT_KEY = "buyerCheckAuthCodeSavedAt";
export const BUYER_CHECK_AUTH_STATUS_KEY = "buyerCheckAuthStatus";
export const BUYER_CHECK_AUTH_RESULT_TIME_KEY = "buyerCheckAuthResultTime";
export const BUYER_CHECK_AUTH_TYPE_CODE_KEY = "buyerCheckAuthTypeCode";
export const BUYER_CHECK_KIOSK_CODE_KEY = "buyerCheckKioskCode";

export const BUYER_CHECK_PRODUCT_ID_KEY = "buyerCheckProductId";
export const BUYER_CHECK_PRODUCT_TITLE_KEY = "buyerCheckProductTitle";
export const BUYER_CHECK_PRODUCT_PRICE_KEY = "buyerCheckProductPrice";
export const BUYER_CHECK_PRODUCT_IMAGE_URL_KEY = "buyerCheckProductImageUrl";
export const BUYER_CHECK_PRODUCT_STATUS_CODE_KEY =
  "buyerCheckProductStatusCode";

export const BUYER_CHECK_TRADE_ID_KEY = "buyerCheckTradeId";
export const BUYER_CHECK_LOCKER_ID_KEY = "buyerCheckLockerId";
export const BUYER_CHECK_LOCKER_NO_KEY = "buyerCheckLockerNo";

export const BUYER_CHECK_SELLER_IMAGE_URL_KEY =
  "buyerCheckSellerStoredImageUrl";
export const BUYER_CHECK_CURRENT_IMAGE_URL_KEY =
  "buyerCheckCurrentCaptureImageUrl";

export const BUYER_CHECK_EXPIRE_WATCH_DELAY_MS = 9 * 60 * 1000 + 50 * 1000;

export function getBuyerCheckAuthCode() {
  return sessionStorage.getItem(BUYER_CHECK_AUTH_CODE_KEY) || "";
}

export function getBuyerCheckAuthStatus() {
  return sessionStorage.getItem(BUYER_CHECK_AUTH_STATUS_KEY) || "";
}

export function getBuyerCheckKioskCode() {
  return sessionStorage.getItem(BUYER_CHECK_KIOSK_CODE_KEY) || "";
}

export function saveBuyerCheckAuthSession(params: {
  AUTH_CODE: string;
  AUTH_STATUS_CODE?: string;
  AUTH_RESULT_TIME?: string | null;
  AUTH_TYPE_CODE?: string;
  KIOSK_CODE?: string;
}) {
  sessionStorage.setItem(BUYER_CHECK_AUTH_CODE_KEY, params.AUTH_CODE);

  const savedAt = sessionStorage.getItem(BUYER_CHECK_AUTH_SAVED_AT_KEY);

  if (!savedAt) {
    sessionStorage.setItem(BUYER_CHECK_AUTH_SAVED_AT_KEY, String(Date.now()));
  }

  if (params.AUTH_STATUS_CODE) {
    sessionStorage.setItem(
      BUYER_CHECK_AUTH_STATUS_KEY,
      params.AUTH_STATUS_CODE,
    );
  }

  if (params.AUTH_RESULT_TIME != null) {
    sessionStorage.setItem(
      BUYER_CHECK_AUTH_RESULT_TIME_KEY,
      params.AUTH_RESULT_TIME,
    );
  }

  if (params.AUTH_TYPE_CODE) {
    sessionStorage.setItem(
      BUYER_CHECK_AUTH_TYPE_CODE_KEY,
      params.AUTH_TYPE_CODE,
    );
  }

  if (params.KIOSK_CODE) {
    sessionStorage.setItem(BUYER_CHECK_KIOSK_CODE_KEY, params.KIOSK_CODE);
  }
}

export function updateBuyerCheckAuthStatus(params: {
  AUTH_STATUS_CODE: string;
  AUTH_RESULT_TIME?: string | null;
  AUTH_TYPE_CODE?: string;
}) {
  sessionStorage.setItem(BUYER_CHECK_AUTH_STATUS_KEY, params.AUTH_STATUS_CODE);

  if (params.AUTH_RESULT_TIME != null) {
    sessionStorage.setItem(
      BUYER_CHECK_AUTH_RESULT_TIME_KEY,
      params.AUTH_RESULT_TIME,
    );
  }

  if (params.AUTH_TYPE_CODE) {
    sessionStorage.setItem(
      BUYER_CHECK_AUTH_TYPE_CODE_KEY,
      params.AUTH_TYPE_CODE,
    );
  }
}

export function clearBuyerCheckAuthSession() {
  sessionStorage.removeItem(BUYER_CHECK_AUTH_CODE_KEY);
  sessionStorage.removeItem(BUYER_CHECK_AUTH_SAVED_AT_KEY);
  sessionStorage.removeItem(BUYER_CHECK_AUTH_STATUS_KEY);
  sessionStorage.removeItem(BUYER_CHECK_AUTH_RESULT_TIME_KEY);
  sessionStorage.removeItem(BUYER_CHECK_AUTH_TYPE_CODE_KEY);
  sessionStorage.removeItem(BUYER_CHECK_KIOSK_CODE_KEY);
}

export function clearBuyerCheckSession() {
  clearBuyerCheckAuthSession();

  sessionStorage.removeItem(BUYER_CHECK_PRODUCT_ID_KEY);
  sessionStorage.removeItem(BUYER_CHECK_PRODUCT_TITLE_KEY);
  sessionStorage.removeItem(BUYER_CHECK_PRODUCT_PRICE_KEY);
  sessionStorage.removeItem(BUYER_CHECK_PRODUCT_IMAGE_URL_KEY);
  sessionStorage.removeItem(BUYER_CHECK_PRODUCT_STATUS_CODE_KEY);

  sessionStorage.removeItem(BUYER_CHECK_TRADE_ID_KEY);
  sessionStorage.removeItem(BUYER_CHECK_LOCKER_ID_KEY);
  sessionStorage.removeItem(BUYER_CHECK_LOCKER_NO_KEY);

  sessionStorage.removeItem(BUYER_CHECK_SELLER_IMAGE_URL_KEY);
  sessionStorage.removeItem(BUYER_CHECK_CURRENT_IMAGE_URL_KEY);
}

export function getBuyerCheckAuthSavedAt() {
  const savedAt = Number(sessionStorage.getItem(BUYER_CHECK_AUTH_SAVED_AT_KEY));

  return Number.isFinite(savedAt) && savedAt > 0 ? savedAt : 0;
}

export function getBuyerCheckExpireWatchDelay() {
  const savedAt = getBuyerCheckAuthSavedAt();

  if (!savedAt) {
    return BUYER_CHECK_EXPIRE_WATCH_DELAY_MS;
  }

  const elapsed = Date.now() - savedAt;

  return Math.max(BUYER_CHECK_EXPIRE_WATCH_DELAY_MS - elapsed, 0);
}

export function saveBuyerCheckProduct(params: {
  PRODUCT_ID: number;
  TRADE_ID?: number;
  TITLE: string;
  BASE_PRICE?: number;
  PRODUCT_STATUS_CODE?: string;
  IMAGE_URL?: string;
}) {
  sessionStorage.setItem(BUYER_CHECK_PRODUCT_ID_KEY, String(params.PRODUCT_ID));
  sessionStorage.setItem(BUYER_CHECK_PRODUCT_TITLE_KEY, params.TITLE);

  if (params.TRADE_ID) {
    sessionStorage.setItem(BUYER_CHECK_TRADE_ID_KEY, String(params.TRADE_ID));
  }

  if (typeof params.BASE_PRICE === "number") {
    sessionStorage.setItem(
      BUYER_CHECK_PRODUCT_PRICE_KEY,
      String(params.BASE_PRICE),
    );
  }

  if (params.PRODUCT_STATUS_CODE) {
    sessionStorage.setItem(
      BUYER_CHECK_PRODUCT_STATUS_CODE_KEY,
      params.PRODUCT_STATUS_CODE,
    );
  }

  if (params.IMAGE_URL) {
    sessionStorage.setItem(BUYER_CHECK_PRODUCT_IMAGE_URL_KEY, params.IMAGE_URL);
  }
}

export function getBuyerCheckProduct() {
  return {
    PRODUCT_ID: Number(sessionStorage.getItem(BUYER_CHECK_PRODUCT_ID_KEY) || 0),
    TRADE_ID: Number(sessionStorage.getItem(BUYER_CHECK_TRADE_ID_KEY) || 0),
    TITLE: sessionStorage.getItem(BUYER_CHECK_PRODUCT_TITLE_KEY) || "",
    BASE_PRICE: Number(
      sessionStorage.getItem(BUYER_CHECK_PRODUCT_PRICE_KEY) || 0,
    ),
    PRODUCT_STATUS_CODE:
      sessionStorage.getItem(BUYER_CHECK_PRODUCT_STATUS_CODE_KEY) || "",
    IMAGE_URL: sessionStorage.getItem(BUYER_CHECK_PRODUCT_IMAGE_URL_KEY) || "",
  };
}

export function saveBuyerCheckLocker(params: {
  TRADE_ID?: number;
  PRODUCT_ID?: number;
  LOCKER_ID: number;
  LOCKER_NO?: number;
}) {
  if (params.TRADE_ID) {
    sessionStorage.setItem(BUYER_CHECK_TRADE_ID_KEY, String(params.TRADE_ID));
  }

  if (params.PRODUCT_ID) {
    sessionStorage.setItem(
      BUYER_CHECK_PRODUCT_ID_KEY,
      String(params.PRODUCT_ID),
    );
  }

  sessionStorage.setItem(BUYER_CHECK_LOCKER_ID_KEY, String(params.LOCKER_ID));
  sessionStorage.setItem(
    BUYER_CHECK_LOCKER_NO_KEY,
    String(params.LOCKER_NO || params.LOCKER_ID),
  );
}

export function getBuyerCheckLocker() {
  return {
    TRADE_ID: Number(sessionStorage.getItem(BUYER_CHECK_TRADE_ID_KEY) || 0),
    PRODUCT_ID: Number(sessionStorage.getItem(BUYER_CHECK_PRODUCT_ID_KEY) || 0),
    LOCKER_ID: Number(sessionStorage.getItem(BUYER_CHECK_LOCKER_ID_KEY) || 0),
    LOCKER_NO: Number(sessionStorage.getItem(BUYER_CHECK_LOCKER_NO_KEY) || 0),
  };
}

export function saveBuyerCheckImages(params: {
  sellerStoredImageUrl?: string;
  currentCaptureImageUrl?: string;
}) {
  if (params.sellerStoredImageUrl != null) {
    sessionStorage.setItem(
      BUYER_CHECK_SELLER_IMAGE_URL_KEY,
      params.sellerStoredImageUrl,
    );
  }

  if (params.currentCaptureImageUrl != null) {
    sessionStorage.setItem(
      BUYER_CHECK_CURRENT_IMAGE_URL_KEY,
      params.currentCaptureImageUrl,
    );
  }
}

export function getBuyerCheckImages() {
  return {
    sellerStoredImageUrl:
      sessionStorage.getItem(BUYER_CHECK_SELLER_IMAGE_URL_KEY) || "",
    currentCaptureImageUrl:
      sessionStorage.getItem(BUYER_CHECK_CURRENT_IMAGE_URL_KEY) || "",
  };
}
