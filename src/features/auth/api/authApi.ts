import { api } from "../../../app/config/api";
import type { Me } from "../../../app/providers/auth/AuthProvider";

export const authApi = {
  me: async (): Promise<Me> => {
    const accessToken = localStorage.getItem("accessToken");

    return api("/auth/me", {
      method: "GET",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    });
  },

  loginGoogle: async (payload: { idToken: string }) => {
    return api("/auth/google", { method: "POST", json: payload });
  },

  logout: async () => {
    return api("/auth/logout", { method: "POST" });
  },
};
