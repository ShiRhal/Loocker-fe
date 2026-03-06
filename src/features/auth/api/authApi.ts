import { api } from "../../../app/config/api";
import type { Me } from "../../../app/providers/auth/AuthProvider";

export const authApi = {
  // ✅ 로그인 상태 확인 (세션 쿠키 기반)
  me: async (): Promise<Me> => {
    return api("/auth/me", { method: "GET" });
  },

  // ✅ B방식: FE가 받은 id_token을 BE로 1회 전달
  loginGoogle: async (payload: { idToken: string }) => {
    return api("/auth/google", { method: "POST", json: payload });
  },

  logout: async () => {
    return api("/auth/logout", { method: "POST" });
  },
};
