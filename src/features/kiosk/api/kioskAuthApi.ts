import { api } from "../../../app/config/api";

export type KioskLoginRequest = {
  LOGIN_ID: string;
  LOGIN_PW: string;
};

export type KioskLoginResponse = {
  LOGIN_ID: string;
  STATE: string;
  CITY: string;
  BRANCH_NAME: string;
  DETAIL_ADDRESS: string;
  KIOSK_CODE: string;
  LOCKER_COUNT: number;
  KIOSK_ACCESS_TOKEN: string;
};

export const kioskAuthApi = {
  async verify(code: string): Promise<void> {
    await api(`/kiosk/verify?CODE=${encodeURIComponent(code)}`, {
      method: "GET",
    });
  },

  async login(body: KioskLoginRequest): Promise<KioskLoginResponse> {
    const query = new URLSearchParams();

    query.set("LOGIN_ID", body.LOGIN_ID);
    query.set("LOGIN_PW", body.LOGIN_PW);

    const res = await api(`/kiosk/login?${query.toString()}`, {
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
};
