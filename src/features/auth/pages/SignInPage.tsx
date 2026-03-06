import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/auth/useAuth";
import styles from "./SignInPage.module.css";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";

// ✅ env: REACT_APP_GOOGLE_CLIENT_ID=...
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim();

export default function SignInPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const redirect = useMemo(() => params.get("redirect") || "/", [params]);

  const { me, loginWithGoogleIdToken } = useAuth();
  const [keepLogin, setKeepLogin] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 이미 로그인 상태면 redirect로 보내기
  useEffect(() => {
    if (me) nav(redirect, { replace: true });
  }, [me, nav, redirect]);

  // Google Identity Services 로드
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const existed = document.querySelector(`script[src="${GOOGLE_SCRIPT}"]`);
    if (existed) return;

    const s = document.createElement("script");
    s.src = GOOGLE_SCRIPT;
    s.async = true;
    s.defer = true;
    document.body.appendChild(s);
  }, []);

  const onGoogleClick = async () => {
    setErr(null);

    if (!GOOGLE_CLIENT_ID) {
      setErr("REACT_APP_GOOGLE_CLIENT_ID가 설정되지 않았습니다.");
      return;
    }

    // 스크립트 로딩 대기
    if (!window.google?.accounts?.id) {
      setErr(
        "Google 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 클릭하세요.",
      );
      return;
    }

    // ✅ 팝업/원탭 대신: 클릭 시 credential 콜백 받는 방식
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (resp: { credential?: string }) => {
        try {
          const idToken = resp?.credential;
          if (!idToken) throw new Error("id_token(credential)이 없습니다.");

          // ✅ B방식: FE는 저장 X, BE로 전달 → BE가 세션쿠키 발급
          await loginWithGoogleIdToken(idToken);

          // keepLogin은 지금은 UI만 (나중에 BE 세션 만료정책과 연결)
          nav(redirect, { replace: true });
        } catch (e: any) {
          setErr(e?.message || "구글 로그인 실패");
        }
      },
    });

    // 버튼 클릭으로 프롬프트 띄움
    window.google.accounts.id.prompt();
  };

  return (
    <div className={styles.page}>
      <div className={styles.brandTop} onClick={() => nav("/")}>
        <div className={styles.brandMark} aria-hidden="true" />
      </div>

      <section className={styles.card}>
        <div className={styles.headline}>
          Loocker <span className={styles.green}>로그인</span>
        </div>

        <div className={styles.illust} aria-hidden="true">
          📦
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

        {/* ✅ 네이버 대신 구글 */}
        <button className={styles.btnGoogle} onClick={onGoogleClick}>
          <span className={styles.icon}>G</span>
          <span className={styles.btnText}>구글로 시작하기</span>
          <span className={styles.spacer} />
        </button>

        <button
          className={styles.btnKakao}
          onClick={() => alert("카카오 로그인: 나중에 연결")}
        >
          <span className={styles.icon}>K</span>
          <span className={styles.btnText}>카카오로 시작하기</span>
          <span className={styles.spacer} />
        </button>

        <button
          className={styles.btnPhone}
          onClick={() => alert("휴대폰 OTP: 나중에 연결")}
        >
          <span className={styles.icon}>👤</span>
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
