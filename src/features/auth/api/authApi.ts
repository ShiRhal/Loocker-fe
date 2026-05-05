import { webapi } from "../../../shared/api/apiClient"; 
import type { Me } from "../../../app/providers/auth/AuthProvider";

function getStoredAccessToken() {
  const token = localStorage.getItem("accessToken");

  if (!token || token === "null" || token === "undefined") {
    return null;
  }

  return token;
}

export const authApi = {
  me: async (): Promise<Me> => {
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      throw new Error("NO_ACCESS_TOKEN");
    }

    return webapi("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  loginGoogle: async (payload: { idToken: string }) => {
    return webapi("/auth/google", { method: "POST", json: payload });
  },

  logout: async () => {
    return webapi("/auth/logout", { method: "POST" });
  },
};
