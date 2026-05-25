import { kioskapi } from "../../../shared/api/apiClient";

export type KioskLoginRequest = {
  LOGIN_ID: string;
  LOGIN_PW: string;
};

export type KioskLoginResponse = {
  KIOSK_ID: number;
  LOGIN_ID: string;
  STATE: string;
  CITY: string;
  BRANCH_NAME: string;
  DETAIL_ADDRESS: string;
  KIOSK_CODE: string;
  LOCKER_COUNT: number;
  KIOSK_ACCESS_TOKEN: string;
};

export type KioskAuthCreateRequest = {
  AUTH_CODE: string;
  KIOSK_ID: number;
  AUTH_TYPE_CODE: "SELLER_DEPOSIT" | "BUYER_PICKUP" | string;
  KIOSK_CODE: string;
};

export type KioskAuthCreateResponse = {
  AUTH_CODE: string;
};

export type KioskAuthSelectRequest = {
  AUTH_CODE: string;
  KIOSK_CODE: string;
};

export type KioskAuthSelectResponse = {
  AUTH_CODE: string;
  AUTH_RESULT_TIME?: string | null;
  AUTH_STATUS_CODE: "WAITING" | "VERIFIED" | "EXPIRED" | string;
  AUTH_TYPE_CODE: string;
};

export type KioskAuthUpdateRequest = {
  AUTH_CODE: string;
  USER_ID: number;
};

function unwrapFirst<T>(data: T | T[]): T {
  return Array.isArray(data) ? data[0] : data;
}

function normalizeAuthCreateResponse(data: any): KioskAuthCreateResponse {
  const result = unwrapFirst<any>(data);

  if (typeof result === "string") {
    return {
      AUTH_CODE: result,
    };
  }

  if (result?.AUTH_CODE) {
    return {
      AUTH_CODE: result.AUTH_CODE,
    };
  }

  if (result?.authCode) {
    return {
      AUTH_CODE: result.authCode,
    };
  }

  throw new Error("AUTH_CODE 발급에 실패했습니다.");
}

export const kioskAuthApi = {
  async verify(code: string): Promise<void> {
    await kioskapi(`/verify?CODE=${encodeURIComponent(code)}`, {
      method: "GET",
    });
  },

  async login(body: KioskLoginRequest): Promise<KioskLoginResponse> {
    const query = new URLSearchParams();

    query.set("LOGIN_ID", body.LOGIN_ID);
    query.set("LOGIN_PW", body.LOGIN_PW);

    const res = await kioskapi(`/login?${query.toString()}`, {
      method: "GET",
    });

    const result = Array.isArray(res) ? res[0] : res;

    if (!result) {
      throw new Error("일치하는 키오스크 계정이 없습니다.");
    }

    if (!result.KIOSK_ACCESS_TOKEN) {
      throw new Error("키오스크 인증 토큰이 없습니다.");
    }

    return result;
  },

  async createAuthSession(
    body: KioskAuthCreateRequest,
  ): Promise<KioskAuthCreateResponse> {
    const res = await kioskapi("/auth/create", {
      method: "PUT",
      json: body,
    });

    return normalizeAuthCreateResponse(res);
  },

  async selectAuthSession(
    body: KioskAuthSelectRequest,
  ): Promise<KioskAuthSelectResponse | null> {
    const query = new URLSearchParams();

    query.set("AUTH_CODE", body.AUTH_CODE);
    query.set("KIOSK_CODE", body.KIOSK_CODE);

    const res = await kioskapi(`/auth/select?${query.toString()}`, {
      method: "GET",
    });

    if (Array.isArray(res)) {
      return res[0] ?? null;
    }

    return res ?? null;
  },

  async updateAuthSession(body: KioskAuthUpdateRequest): Promise<void> {
    await kioskapi("/auth/update", {
      method: "PUT",
      json: body,
    });
  },
};
