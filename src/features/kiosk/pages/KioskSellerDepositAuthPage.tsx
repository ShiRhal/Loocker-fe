import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { kioskAuthApi } from "../api/kioskAuthApi";
import styles from "../styles/kiosk.module.css";
import logoImage from "../../../assets/images/Loocker.png";
import {
  clearSellerDepositSession,
  getSellerDepositAuthCode,
  saveSellerDepositAuthSession,
  updateSellerDepositAuthStatus,
} from "../utils/sellerDepositSession";

const AUTH_TYPE_CODE = "SELLER_DEPOSIT";

export default function KioskSellerDepositAuthPage() {
  const navigate = useNavigate();

  const [authCode, setAuthCode] = useState("");
  const [authStatusCode, setAuthStatusCode] = useState("WAITING");
  const [authResultTime, setAuthResultTime] = useState<string | null>(null);
  const [message, setMessage] = useState("QR 인증 세션을 확인하고 있습니다.");
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const pollingRef = useRef<number | null>(null);
  const moveTimerRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const verifiedHandledRef = useRef(false);

  const kioskId = Number(localStorage.getItem("kioskId"));
  const kioskCode = localStorage.getItem("kioskCode") || "";

  const qrUrl = useMemo(() => {
    if (!authCode) return "";
    return `${window.location.origin}/m/login/${authCode}`;
  }, [authCode]);

  function stopAuthPolling() {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function stopMoveTimer() {
    if (moveTimerRef.current) {
      window.clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
  }

  function moveToProductPage(nextAuthCode: string) {
    stopAuthPolling();
    stopMoveTimer();

    moveTimerRef.current = window.setTimeout(() => {
      stopAuthPolling();

      navigate(`/kiosk/seller/deposit/products/${nextAuthCode}`, {
        replace: true,
      });
    }, 2000);
  }

  function handleVerifiedAuth(result: {
    AUTH_CODE: string;
    AUTH_STATUS_CODE: string;
    AUTH_RESULT_TIME?: string | null;
    AUTH_TYPE_CODE?: string;
  }) {
    verifiedHandledRef.current = true;
    stopAuthPolling();

    saveSellerDepositAuthSession({
      AUTH_CODE: result.AUTH_CODE,
      AUTH_STATUS_CODE: result.AUTH_STATUS_CODE,
      AUTH_RESULT_TIME: result.AUTH_RESULT_TIME ?? "",
      AUTH_TYPE_CODE: result.AUTH_TYPE_CODE || AUTH_TYPE_CODE,
    });

    setAuthCode(result.AUTH_CODE);
    setAuthStatusCode(result.AUTH_STATUS_CODE);
    setAuthResultTime(result.AUTH_RESULT_TIME ?? null);
    setCompleted(true);
    setMessage("인증이 완료되었습니다. 2초 후 상품 선택 화면으로 이동합니다.");

    moveToProductPage(result.AUTH_CODE);
  }

  function handleGoHome() {
    stopAuthPolling();
    stopMoveTimer();
    navigate("/kiosk");
  }

  useEffect(() => {
    async function initializeAuthSession() {
      if (initializedRef.current) return;
      initializedRef.current = true;

      if (!kioskId || !kioskCode) {
        setLoading(false);
        setMessage("키오스크 정보가 없습니다. 다시 로그인해주세요.");
        return;
      }

      try {
        setLoading(true);
        setMessage("QR 인증 세션을 확인하고 있습니다.");

        const savedAuthCode = getSellerDepositAuthCode();

        if (savedAuthCode) {
          const savedResult = await kioskAuthApi.selectAuthSession({
            AUTH_CODE: savedAuthCode,
            KIOSK_CODE: kioskCode,
          });

          if (savedResult?.AUTH_STATUS_CODE === "VERIFIED") {
            handleVerifiedAuth({
              AUTH_CODE: savedResult.AUTH_CODE,
              AUTH_STATUS_CODE: savedResult.AUTH_STATUS_CODE,
              AUTH_RESULT_TIME: savedResult.AUTH_RESULT_TIME ?? "",
              AUTH_TYPE_CODE: savedResult.AUTH_TYPE_CODE,
            });

            return;
          }

          if (savedResult?.AUTH_STATUS_CODE === "WAITING") {
            saveSellerDepositAuthSession({
              AUTH_CODE: savedAuthCode,
              AUTH_STATUS_CODE: "WAITING",
              AUTH_RESULT_TIME: savedResult.AUTH_RESULT_TIME ?? "",
              AUTH_TYPE_CODE: savedResult.AUTH_TYPE_CODE || AUTH_TYPE_CODE,
            });

            setAuthCode(savedAuthCode);
            setAuthStatusCode("WAITING");
            setAuthResultTime(savedResult.AUTH_RESULT_TIME ?? null);
            setMessage("기존 QR 인증 세션이 진행 중입니다.");
            return;
          }

          if (savedResult?.AUTH_STATUS_CODE === "EXPIRED") {
            stopAuthPolling();
            clearSellerDepositSession();

            navigate("/kiosk/error", {
              replace: true,
              state: {
                message:
                  "인증 시간이 만료되었습니다. 처음부터 다시 진행해주세요.",
              },
            });

            return;
          }

          clearSellerDepositSession();
        }

        setMessage("QR 인증 세션을 생성하고 있습니다.");

        const result = await kioskAuthApi.createAuthSession({
          AUTH_CODE: "",
          KIOSK_ID: kioskId,
          AUTH_TYPE_CODE,
          KIOSK_CODE: kioskCode,
        });

        saveSellerDepositAuthSession({
          AUTH_CODE: result.AUTH_CODE,
          AUTH_STATUS_CODE: "WAITING",
          AUTH_TYPE_CODE,
        });

        setAuthCode(result.AUTH_CODE);
        setAuthStatusCode("WAITING");
        setMessage("모바일 기기로 QR 코드를 스캔해주세요.");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "QR 인증 세션 처리에 실패했습니다.",
        );
      } finally {
        setLoading(false);
      }
    }

    initializeAuthSession();

    return () => {
      stopAuthPolling();
      stopMoveTimer();
    };
  }, [kioskId, kioskCode, navigate]);

  useEffect(() => {
    if (!authCode || !kioskCode) return;

    if (
      completed ||
      verifiedHandledRef.current ||
      authStatusCode === "VERIFIED"
    ) {
      stopAuthPolling();
      return;
    }

    let cancelled = false;

    async function pollAuthStatus() {
      if (
        cancelled ||
        completed ||
        verifiedHandledRef.current ||
        authStatusCode === "VERIFIED"
      ) {
        stopAuthPolling();
        return;
      }

      try {
        const result = await kioskAuthApi.selectAuthSession({
          AUTH_CODE: authCode,
          KIOSK_CODE: kioskCode,
        });

        if (!result || cancelled) return;

        setAuthStatusCode(result.AUTH_STATUS_CODE);
        setAuthResultTime(result.AUTH_RESULT_TIME ?? null);

        updateSellerDepositAuthStatus({
          AUTH_STATUS_CODE: result.AUTH_STATUS_CODE,
          AUTH_RESULT_TIME: result.AUTH_RESULT_TIME ?? "",
          AUTH_TYPE_CODE: result.AUTH_TYPE_CODE,
        });

        if (result.AUTH_STATUS_CODE === "VERIFIED") {
          handleVerifiedAuth({
            AUTH_CODE: result.AUTH_CODE,
            AUTH_STATUS_CODE: result.AUTH_STATUS_CODE,
            AUTH_RESULT_TIME: result.AUTH_RESULT_TIME ?? "",
            AUTH_TYPE_CODE: result.AUTH_TYPE_CODE,
          });

          return;
        }

        if (result.AUTH_STATUS_CODE === "EXPIRED") {
          stopAuthPolling();
          clearSellerDepositSession();

          navigate("/kiosk/error", {
            replace: true,
            state: {
              message:
                "인증 시간이 만료되었습니다. 처음부터 다시 진행해주세요.",
            },
          });
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "인증 상태 조회에 실패했습니다.",
        );
      }
    }

    stopAuthPolling();

    pollAuthStatus();

    pollingRef.current = window.setInterval(() => {
      pollAuthStatus();
    }, 1000);

    return () => {
      cancelled = true;
      stopAuthPolling();
    };
  }, [authCode, kioskCode, completed, authStatusCode, navigate]);

  return (
    <main className={styles.authPage}>
      <header className={styles.authHeader}>
        <img className={styles.authLogo} src={logoImage} alt="Loocker" />

        <button
          className={styles.authHomeButton}
          type="button"
          onClick={handleGoHome}
        >
          처음으로
        </button>
      </header>

      <section className={styles.authCard}>
        <h1 className={styles.authTitle}>판매자 물품 보관 인증</h1>

        <p className={styles.authDescription}>
          모바일 기기로 QR 코드를 스캔한 뒤 로그인해주세요.
        </p>

        <div className={styles.qrBox}>
          {loading && <div className={styles.qrPlaceholder}>확인 중...</div>}

          {!loading && qrUrl && !completed && (
            <QRCodeCanvas value={qrUrl} size={320} includeMargin />
          )}

          {completed && (
            <div className={styles.successCircle}>
              <span>✓</span>
            </div>
          )}

          {!loading && !qrUrl && !completed && (
            <div className={styles.qrPlaceholder}>QR 생성 실패</div>
          )}
        </div>

        <div className={styles.authStatusBox}>
          <p>인증 상태: {authStatusCode}</p>
          {authResultTime && <p>인증 시간: {authResultTime}</p>}
          <p>{message}</p>
        </div>

        {qrUrl && !completed && (
          <button
            className={styles.testLinkButton}
            type="button"
            onClick={() => window.open(qrUrl, "_blank")}
          >
            테스트용 모바일 로그인 페이지 열기
          </button>
        )}

        {completed && (
          <div className={styles.progressNoticeBox}>
            <h2>인증 완료</h2>
            <p>잠시 후 보관할 상품 선택 화면으로 이동합니다.</p>
          </div>
        )}
      </section>
    </main>
  );
}
