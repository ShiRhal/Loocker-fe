import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/auth/useAuth";
import styles from "./SignInPage.module.css";
import logoImg from "../../../assets/images/Loocker.png";
import "../../../shared/styles/global.css";
import GoogleIcon from "../../../assets/icons/Google.svg";
import KakaoIcon from "../../../assets/icons/Kakao.svg";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export default function SignInPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const redirect = useMemo(() => params.get("redirect") || "/", [params]);

  const { me, loginWithGoogleIdToken } = useAuth();
  const [keepLogin, setKeepLogin] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (me) nav(redirect, { replace: true });
  }, [me, nav, redirect]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: { credential?: string }) => {
          try {
            const idToken = resp?.credential;
            if (!idToken) throw new Error("id_token(credential)이 없습니다.");

            await loginWithGoogleIdToken(idToken);
            nav(redirect, { replace: true });
          } catch (e: any) {
            setErr(e?.message || "구글 로그인 실패");
          }
        },
      });

      setGoogleReady(true);
    };

    const existed = document.querySelector(`script[src="${GOOGLE_SCRIPT}"]`);

    if (existed) {
      setTimeout(initGoogle, 300);
      return;
    }

    const s = document.createElement("script");
    s.src = GOOGLE_SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = initGoogle;
    document.body.appendChild(s);
  }, [loginWithGoogleIdToken, nav, redirect]);

  const onGoogleClick = () => {
    setErr(null);

    if (!googleReady) {
      setErr("Google 로그인 모듈이 아직 준비되지 않았습니다.");
      return;
    }

    window.google.accounts.id.prompt();
  };

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brandTop} onClick={() => nav("/")}>
          <img src={logoImg} alt="Looker 로고" className={styles.brandLogo} />
        </div>

        <label className={styles.keepRow}>
          <input
            type="checkbox"
            checked={keepLogin}
            onChange={(e) => setKeepLogin(e.target.checked)}
          />
          <span>로그인 유지하기</span>
        </label>

        {err && <div className={styles.error}>{err}</div>}

        <button className={styles.btnGoogle} onClick={onGoogleClick}>
          <span className={styles.icon}>
            <img src={GoogleIcon} alt="Google" className={styles.iconImg} />
          </span>
          <span className={styles.btnText}>구글로 시작하기</span>
          <span className={styles.spacer} />
        </button>

        <button
          className={styles.btnKakao}
          onClick={() => alert("카카오 로그인: 나중에 연결")}
        >
          <span className={styles.icon}>
            <img src={KakaoIcon} alt="Kakao" className={styles.iconImg} />
          </span>
          <span className={styles.btnText}>카카오로 시작하기</span>
          <span className={styles.spacer} />
        </button>

        <button
          className={styles.btnPhone}
          onClick={() => alert("휴대폰 OTP: 나중에 연결")}
        >
          <span className={styles.icon}>
            <svg
              className={styles.userSvg}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </span>
          <span className={styles.btnText}>휴대폰번호로 시작하기</span>
          <span className={styles.spacer} />
        </button>

        <div className={styles.guestRow}>
          <button
            className={styles.guestBtn}
            onClick={() => nav(redirect || "/")}
          >
            비회원 둘러보기
            <span className={styles.underline} />
          </button>
        </div>

        <div className={styles.notice}>
          공용 PC에서는 [로그인 유지하기]를 꺼주세요
        </div>
      </section>
    </div>
  );
}
