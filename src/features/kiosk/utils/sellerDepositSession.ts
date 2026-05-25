export const SELLER_DEPOSIT_AUTH_CODE_KEY = "sellerDepositAuthCode";
export const SELLER_DEPOSIT_AUTH_SAVED_AT_KEY = "sellerDepositAuthCodeSavedAt";
export const SELLER_DEPOSIT_AUTH_STATUS_KEY = "sellerDepositAuthStatus";
export const SELLER_DEPOSIT_AUTH_RESULT_TIME_KEY =
  "sellerDepositAuthResultTime";
export const SELLER_DEPOSIT_AUTH_TYPE_CODE_KEY = "sellerDepositAuthTypeCode";
export const SELLER_DEPOSIT_PRODUCT_ID_KEY = "sellerDepositProductId";
export const SELLER_DEPOSIT_PRODUCT_TITLE_KEY = "sellerDepositProductTitle";
export const SELLER_DEPOSIT_TRADE_ID_KEY = "sellerDepositTradeId";
export const SELLER_DEPOSIT_LOCKER_ID_KEY = "sellerDepositLockerId";

export const SELLER_DEPOSIT_EXPIRE_WATCH_DELAY_MS = 9 * 60 * 1000 + 50 * 1000;

export function getSellerDepositAuthCode() {
  return sessionStorage.getItem(SELLER_DEPOSIT_AUTH_CODE_KEY) || "";
}

export function getSellerDepositAuthStatus() {
  return sessionStorage.getItem(SELLER_DEPOSIT_AUTH_STATUS_KEY) || "";
}

export function saveSellerDepositAuthSession(params: {
  AUTH_CODE: string;
  AUTH_STATUS_CODE?: string;
  AUTH_RESULT_TIME?: string | null;
  AUTH_TYPE_CODE?: string;
}) {
  sessionStorage.setItem(SELLER_DEPOSIT_AUTH_CODE_KEY, params.AUTH_CODE);

  const savedAt = sessionStorage.getItem(SELLER_DEPOSIT_AUTH_SAVED_AT_KEY);

  if (!savedAt) {
    sessionStorage.setItem(
      SELLER_DEPOSIT_AUTH_SAVED_AT_KEY,
      String(Date.now()),
    );
  }

  if (params.AUTH_STATUS_CODE) {
    sessionStorage.setItem(
      SELLER_DEPOSIT_AUTH_STATUS_KEY,
      params.AUTH_STATUS_CODE,
    );
  }

  if (params.AUTH_RESULT_TIME != null) {
    sessionStorage.setItem(
      SELLER_DEPOSIT_AUTH_RESULT_TIME_KEY,
      params.AUTH_RESULT_TIME,
    );
  }

  if (params.AUTH_TYPE_CODE) {
    sessionStorage.setItem(
      SELLER_DEPOSIT_AUTH_TYPE_CODE_KEY,
      params.AUTH_TYPE_CODE,
    );
  }
}

export function updateSellerDepositAuthStatus(params: {
  AUTH_STATUS_CODE: string;
  AUTH_RESULT_TIME?: string | null;
  AUTH_TYPE_CODE?: string;
}) {
  sessionStorage.setItem(
    SELLER_DEPOSIT_AUTH_STATUS_KEY,
    params.AUTH_STATUS_CODE,
  );

  if (params.AUTH_RESULT_TIME != null) {
    sessionStorage.setItem(
      SELLER_DEPOSIT_AUTH_RESULT_TIME_KEY,
      params.AUTH_RESULT_TIME,
    );
  }

  if (params.AUTH_TYPE_CODE) {
    sessionStorage.setItem(
      SELLER_DEPOSIT_AUTH_TYPE_CODE_KEY,
      params.AUTH_TYPE_CODE,
    );
  }
}

export function clearSellerDepositSession() {
  sessionStorage.removeItem(SELLER_DEPOSIT_AUTH_CODE_KEY);
  sessionStorage.removeItem(SELLER_DEPOSIT_AUTH_SAVED_AT_KEY);
  sessionStorage.removeItem(SELLER_DEPOSIT_AUTH_STATUS_KEY);
  sessionStorage.removeItem(SELLER_DEPOSIT_AUTH_RESULT_TIME_KEY);
  sessionStorage.removeItem(SELLER_DEPOSIT_AUTH_TYPE_CODE_KEY);
  sessionStorage.removeItem(SELLER_DEPOSIT_PRODUCT_ID_KEY);
  sessionStorage.removeItem(SELLER_DEPOSIT_PRODUCT_TITLE_KEY);
  sessionStorage.removeItem(SELLER_DEPOSIT_TRADE_ID_KEY);
  sessionStorage.removeItem(SELLER_DEPOSIT_LOCKER_ID_KEY);
}

export function getSellerDepositAuthSavedAt() {
  const savedAt = Number(
    sessionStorage.getItem(SELLER_DEPOSIT_AUTH_SAVED_AT_KEY),
  );

  return Number.isFinite(savedAt) && savedAt > 0 ? savedAt : 0;
}

export function getSellerDepositExpireWatchDelay() {
  const savedAt = getSellerDepositAuthSavedAt();

  if (!savedAt) {
    return SELLER_DEPOSIT_EXPIRE_WATCH_DELAY_MS;
  }

  const elapsed = Date.now() - savedAt;

  return Math.max(SELLER_DEPOSIT_EXPIRE_WATCH_DELAY_MS - elapsed, 0);
}
