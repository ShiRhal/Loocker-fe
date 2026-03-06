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
      const data = await authApi.me(); // ✅ 쿠키 기반 세션 확인
      setMe(data);
    } catch {
      setMe(null);
    }
  };

  const loginWithGoogleIdToken = async (idToken: string) => {
    // ✅ FE는 id_token 저장하지 않음. 그냥 1회 전달만.
    await authApi.loginGoogle({ idToken });
    await refreshMe();
  };

  const logout = async () => {
    try {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(
    () => ({ me, loading, refreshMe, loginWithGoogleIdToken, logout }),
    [me, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
