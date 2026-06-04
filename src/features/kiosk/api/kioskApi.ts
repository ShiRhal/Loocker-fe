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

export type KioskBuyerProduct = {
  TITLE: string;
  PRODUCT_ID: number;
  CREATED_AT?: string;
  IMAGE_URL?: string | null;
  PRODUCT_STATUS_CODE?: string;
  BASE_PRICE: number;
};

export type KioskBuyerLockerResponse = {
  TRADE_ID?: number;
  PRODUCT_ID?: number;
  LOCKER_ID: number;
  LOCKER_NO?: number;
  LOCKER_STATUS_CODE?: string;
  LOCKER_STATUS_NAME?: string;
  SELLER_IMAGE_URL?: string | null;
  CURRENT_IMAGE_URL?: string | null;
  IMAGE_URL?: string | null;
};

export type KioskLockerNextStatus =
  | "SELLER_UNLOCK_REQUESTED"
  | "SELLER_UNLOCK_READY"
  | "SELLER_DEPOSIT_CONFIRMED"
  | "SELLER_DOOR_CLOSE_REQUESTED"
  | "SELLER_DOOR_CLOSED"
  | "SELLER_LOCK_REQUESTED"
  | "SELLER_LOCKED_PHOTO_SAVED"
  | "SELLER_PHOTO_CONFIRMED"
  | "BUYER_INSPECTION_READY"
  | "BUYER_ITEM_CONFIRMED"
  | "PAYMENT_CONFIRMED"
  | "BUYER_UNLOCK_REQUESTED"
  | "BUYER_UNLOCK_READY"
  | "BUYER_PICKUP_DONE"
  | "PICKUP_LOCKED_EMPTY_READY"
  | "EMPTY";

export type KioskLockerRequestTypeCode = "NORMAL" | "RETRY";

export type KioskLockerRoleType = "KIOSK" | "DEVICE";

export type KioskLockerCommandCreateRequest = {
  AUTH_CODE: string;
  KIOSK_CODE: string;
  NEXT_STATUS: KioskLockerNextStatus;
  REQUEST_TYPE_CODE?: KioskLockerRequestTypeCode;
};

export type KioskLockerCommandSuccessCheckRequest = {
  AUTH_CODE: string;
  KIOSK_CODE: string;
  NEXT_STATUS: KioskLockerNextStatus;
};

export type KioskLockerCommandSuccessCheckResponse = {
  COMMAND_STATUS_CODE?: string;
  STATUS_CODE?: string;
  RESULT_STATUS_CODE?: string;
  IS_SUCCESS?: boolean | number;
  IS_FAILED?: boolean | number;
  FAILED_COMMAND?: string;
  COMMAND_TYPE_CODE?: string;
  RESULT_MESSAGE?: string;
  MESSAGE?: string;

  commandStatusCode?: string;
  statusCode?: string;
  resultStatusCode?: string;
  isSuccess?: boolean | number;
  isFailed?: boolean | number;
  failedCommand?: string;
  commandTypeCode?: string;
  resultMessage?: string;
  message?: string;
};

export type KioskLockerUpdateRequest = {
  TRADE_ID: number;
  AUTH_CODE: string;
  NEXT_STATUS: KioskLockerNextStatus;
  ROLE_TYPE: KioskLockerRoleType;
};

export type KioskLockerImageSelectRequest = {
  TRADE_ID: number;
  LOCKER_ID?: number;
  IMAGE_TYPE_CODE: "SELLER_INSERT" | "BUYER_BEFORE_PICKUP" | string;
};

export type KioskLockerImageResponse = {
  LOCKER_IMAGE_ID?: number;
  LOCKER_COMMAND_ID?: number;
  TRADE_ID?: number;
  LOCKER_ID?: number;
  IMAGE_TYPE_CODE?: string;
  IMAGE_URL?: string | null;
  FILE_URL?: string | null;
  CREATED_AT?: string;

  lockerImageId?: number;
  lockerCommandId?: number;
  tradeId?: number;
  lockerId?: number;
  imageTypeCode?: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
  createdAt?: string;
};

function unwrapFirst<T>(data: T | T[]): T {
  return Array.isArray(data) ? data[0] : data;
}

function toArray<T>(data: T | T[] | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
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

  async selectBuyerProducts(body: {
    AUTH_CODE: string;
    KIOSK_CODE: string;
  }): Promise<KioskBuyerProduct[]> {
    const query = new URLSearchParams();

    query.set("AUTH_CODE", body.AUTH_CODE);
    query.set("KIOSK_CODE", body.KIOSK_CODE);

    const res = await kioskapi(`/buyer/product?${query.toString()}`, {
      method: "GET",
    });

    if (!res) return [];

    return Array.isArray(res) ? res : [res];
  },

  async selectBuyerLocker(body: {
    AUTH_CODE: string;
    PRODUCT_ID: number;
    KIOSK_CODE: string;
  }): Promise<KioskBuyerLockerResponse> {
    const query = new URLSearchParams();

    query.set("AUTH_CODE", body.AUTH_CODE);
    query.set("PRODUCT_ID", String(body.PRODUCT_ID));
    query.set("KIOSK_CODE", body.KIOSK_CODE);

    const res = await kioskapi(`/buyer/locker?${query.toString()}`, {
      method: "GET",
    });

    const result = unwrapFirst<KioskBuyerLockerResponse>(res);

    if (!result?.LOCKER_ID) {
      throw new Error("보관함 정보를 확인할 수 없습니다.");
    }

    return result;
  },

  async createLockerCommand(
    body: KioskLockerCommandCreateRequest,
  ): Promise<void> {
    await kioskapi("/locker/command/create", {
      method: "PUT",
      json: {
        AUTH_CODE: body.AUTH_CODE,
        KIOSK_CODE: body.KIOSK_CODE,
        NEXT_STATUS: body.NEXT_STATUS,
        REQUEST_TYPE_CODE: body.REQUEST_TYPE_CODE || "NORMAL",
      },
    });
  },

  async checkLockerCommandSuccess(
    body: KioskLockerCommandSuccessCheckRequest,
  ): Promise<KioskLockerCommandSuccessCheckResponse[]> {
    const query = new URLSearchParams();

    query.set("AUTH_CODE", body.AUTH_CODE);
    query.set("KIOSK_CODE", body.KIOSK_CODE);
    query.set("NEXT_STATUS", body.NEXT_STATUS);

    const res = await kioskapi(
      `/locker/command/success/check?${query.toString()}`,
      {
        method: "GET",
      },
    );

    return toArray<KioskLockerCommandSuccessCheckResponse>(res);
  },

  async updateLockerState(body: KioskLockerUpdateRequest): Promise<void> {
    await kioskapi("/locker/update", {
      method: "PUT",
      json: {
        TRADE_ID: body.TRADE_ID,
        AUTH_CODE: body.AUTH_CODE,
        RESULT_STATUS_CODE: "",
        NEXT_STATUS: body.NEXT_STATUS,
        ROLE_TYPE: body.ROLE_TYPE,
      },
    });
  },

  async selectLockerImage(
    body: KioskLockerImageSelectRequest,
  ): Promise<KioskLockerImageResponse | null> {
    const query = new URLSearchParams();

    query.set("TRADE_ID", String(body.TRADE_ID));
    query.set("IMAGE_TYPE_CODE", body.IMAGE_TYPE_CODE);

    if (body.LOCKER_ID) {
      query.set("LOCKER_ID", String(body.LOCKER_ID));
    }

    const res = await kioskapi(`/locker/image/select?${query.toString()}`, {
      method: "GET",
    });

    if (!res) return null;

    return unwrapFirst<KioskLockerImageResponse>(res);
  },
};
