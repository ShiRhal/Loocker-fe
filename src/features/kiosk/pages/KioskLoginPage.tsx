import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { kioskAuthApi } from "../api/kioskAuthApi";
import styles from "../styles/kiosk.module.css";
import logoImage from "../../../assets/images/Loocker.png";

export default function KioskLoginPage() {
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const kioskAccessToken = localStorage.getItem("kioskAccessToken");

    if (kioskAccessToken) {
      navigate("/kiosk", { replace: true });
      return;
    }

    const kioskCode = localStorage.getItem("kioskCode");

    if (!kioskCode) {
      setVerified(false);
      setChecking(false);
      return;
    }

    async function verifyKioskCode() {
      try {
        setChecking(true);
        await kioskAuthApi.verify(kioskCode as string);
        setVerified(true);
      } catch {
        setVerified(false);
      } finally {
        setChecking(false);
      }
    }

    verifyKioskCode();
  }, [navigate]);

  async function handleLogin() {
    if (!loginId.trim()) {
      setMessage("아이디를 입력해주세요.");
      return;
    }

    if (!loginPw.trim()) {
      setMessage("비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const result = await kioskAuthApi.login({
        LOGIN_ID: loginId.trim(),
        LOGIN_PW: loginPw,
      });

      localStorage.setItem("kioskAccessToken", result.KIOSK_ACCESS_TOKEN);
      localStorage.setItem("kioskLoginId", result.LOGIN_ID);
      localStorage.setItem("kioskBranchName", result.BRANCH_NAME);
      localStorage.setItem("kioskLockerCount", String(result.LOCKER_COUNT));

      localStorage.removeItem("kioskCode");

      navigate("/kiosk", { replace: true });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "로그인에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <h1 className={styles.loginTitle}>확인 중</h1>
          <p className={styles.loginDescription}>
            키오스크 접근 권한을 확인하고 있습니다.
          </p>
        </section>
      </main>
    );
  }

  if (!verified) {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <h1 className={styles.loginTitle}>접근 불가</h1>
          <p className={styles.loginDescription}>
            허용되지 않은 키오스크입니다.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard}>
        <div className={styles.loginLogoBox}>
          <img
            className={styles.loginLogoImage}
            src={logoImage}
            alt="Loocker"
          />
          <p className={styles.loginDescription}>KIOSK LOGIN</p>
        </div>

        <input
          className={styles.loginInput}
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="아이디"
          autoComplete="username"
        />

        <input
          className={styles.loginInput}
          value={loginPw}
          onChange={(e) => setLoginPw(e.target.value)}
          placeholder="비밀번호"
          type="password"
          autoComplete="current-password"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        />

        {message && <p className={styles.loginMessage}>{message}</p>}

        <button
          className={styles.loginButton}
          type="button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </section>
    </main>
  );
}
