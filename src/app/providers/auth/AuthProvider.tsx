import { createContext, ReactNode, useEffect, useMemo, useState } from "react";
import { authApi } from "../../../features/auth/api/authApi";

export type Me = {
  userId: number;
  nickname: string;
  roleCode?: "USER" | "ADMIN";
};

type AuthState = {
  me: Me | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

type Props = { children: ReactNode };

export default function AuthProvider({ children }: Props) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    try {
      const data = await authApi.me();

      setMe(data);
      localStorage.setItem("me", JSON.stringify(data));
      localStorage.setItem("nickname", data.nickname);
    } catch {
      setMe(null);
      localStorage.removeItem("me");
      localStorage.removeItem("nickname");
    }
  };

  const loginWithGoogleIdToken = async (idToken: string) => {
    const res = await authApi.loginGoogle({ idToken });

    if (res?.resultCode !== "SUCCESS" || !res?.accessToken) {
      throw new Error(res?.resultMessage || "로그인 실패");
    }

    localStorage.setItem("accessToken", res.accessToken);

    await refreshMe();
  };

  const logout = async () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("me");
      localStorage.removeItem("nickname");

      await authApi.logout();
    } finally {
      setMe(null);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshMe();
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({ me, loading, refreshMe, loginWithGoogleIdToken, logout }),
    [me, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
