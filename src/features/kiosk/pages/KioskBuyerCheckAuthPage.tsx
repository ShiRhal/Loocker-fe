import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";

import logoImage from "../../../assets/images/Loocker.png";
import { kioskAuthApi } from "../api/kioskAuthApi";
import styles from "../styles/kioskBuyerCheck.module.css";
import {
  clearBuyerCheckAuthSession,
  getBuyerCheckAuthCode,
  saveBuyerCheckAuthSession,
  updateBuyerCheckAuthStatus,
} from "../utils/buyerCheckSession";

const AUTH_TYPE_CODE = "BUYER_PICKUP";

export default function KioskBuyerCheckAuthPage() {
  const navigate = useNavigate();

  const [authCode, setAuthCode] = useState("");
  const [authStatusCode, setAuthStatusCode] = useState("WAITING");
  const [authResultTime, setAuthResultTime] = useState<string | null>(null);
  const [message, setMessage] = useState("QR 인증 세션을 확인하고 있습니다.");
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const [requestPreview, setRequestPreview] = useState({
    AUTH_CODE: "",
    KIOSK_ID: 0,
    AUTH_TYPE_CODE,
    KIOSK_CODE: "",
  });

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

  function moveToProductPage(nextAuthCode: string) {
    moveTimerRef.current = window.setTimeout(() => {
      navigate(`/kiosk/buyer/check/products/${nextAuthCode}`, {
        replace: true,
      });
    }, 2000);
  }

  function handleGoHome() {
    navigate("/kiosk");
  }

  function handleForceMove() {
    if (!authCode) {
      setMessage("AUTH_CODE가 아직 생성되지 않았습니다.");
      return;
    }

    saveBuyerCheckAuthSession({
      AUTH_CODE: authCode,
      AUTH_STATUS_CODE: authStatusCode,
      AUTH_RESULT_TIME: authResultTime ?? "",
      AUTH_TYPE_CODE,
      KIOSK_CODE: kioskCode,
    });

    navigate(`/kiosk/buyer/check/products/${authCode}`);
  }

  async function createNewAuthSession() {
    if (!kioskId || !kioskCode) {
      setMessage("키오스크 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    verifiedHandledRef.current = false;
    setCompleted(false);
    setAuthResultTime(null);
    setAuthStatusCode("WAITING");
    setMessage("구매자 물품 확인 QR 인증 세션을 생성하고 있습니다.");

    const payload = {
      AUTH_CODE: "",
      KIOSK_ID: kioskId,
      AUTH_TYPE_CODE,
      KIOSK_CODE: kioskCode,
    };

    setRequestPreview(payload);

    const result = await kioskAuthApi.createAuthSession(payload);

    console.log("새로 생성된 구매자 AUTH_CODE:", result.AUTH_CODE);

    saveBuyerCheckAuthSession({
      AUTH_CODE: result.AUTH_CODE,
      AUTH_STATUS_CODE: "WAITING",
      AUTH_TYPE_CODE,
      KIOSK_CODE: kioskCode,
    });

    setAuthCode(result.AUTH_CODE);
    setAuthStatusCode("WAITING");
    setMessage("모바일 기기로 QR 코드를 스캔해주세요.");
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

        const savedAuthCode = getBuyerCheckAuthCode();

        if (savedAuthCode) {
          const savedResult = await kioskAuthApi.selectAuthSession({
            AUTH_CODE: savedAuthCode,
            KIOSK_CODE: kioskCode,
          });

          if (savedResult?.AUTH_STATUS_CODE === "VERIFIED") {
            verifiedHandledRef.current = true;

            saveBuyerCheckAuthSession({
              AUTH_CODE: savedResult.AUTH_CODE,
              AUTH_STATUS_CODE: savedResult.AUTH_STATUS_CODE,
              AUTH_RESULT_TIME: savedResult.AUTH_RESULT_TIME ?? "",
              AUTH_TYPE_CODE: savedResult.AUTH_TYPE_CODE,
              KIOSK_CODE: kioskCode,
            });

            setAuthCode(savedResult.AUTH_CODE);
            setAuthStatusCode(savedResult.AUTH_STATUS_CODE);
            setAuthResultTime(savedResult.AUTH_RESULT_TIME ?? null);
            setCompleted(true);
            setMessage(
              "이미 인증이 완료되었습니다. 2초 후 상품 선택 화면으로 이동합니다.",
            );

            moveToProductPage(savedResult.AUTH_CODE);
            return;
          }

          if (savedResult?.AUTH_STATUS_CODE === "WAITING") {
            saveBuyerCheckAuthSession({
              AUTH_CODE: savedAuthCode,
              AUTH_STATUS_CODE: "WAITING",
              AUTH_RESULT_TIME: savedResult.AUTH_RESULT_TIME ?? "",
              AUTH_TYPE_CODE: savedResult.AUTH_TYPE_CODE || AUTH_TYPE_CODE,
              KIOSK_CODE: kioskCode,
            });

            setAuthCode(savedAuthCode);
            setAuthStatusCode("WAITING");
            setAuthResultTime(savedResult.AUTH_RESULT_TIME ?? null);
            setMessage("기존 QR 인증 세션이 진행 중입니다.");
            return;
          }

          if (savedResult?.AUTH_STATUS_CODE === "EXPIRED") {
            clearBuyerCheckAuthSession();
            await createNewAuthSession();
            return;
          }

          clearBuyerCheckAuthSession();
        }

        await createNewAuthSession();
      } catch (error) {
        clearBuyerCheckAuthSession();

        try {
          await createNewAuthSession();
        } catch (createError) {
          setMessage(
            createError instanceof Error
              ? createError.message
              : "QR 인증 세션 처리에 실패했습니다.",
          );
        }
      } finally {
        setLoading(false);
      }
    }

    initializeAuthSession();
  }, [kioskId, kioskCode, navigate]);

  useEffect(() => {
    if (!authCode || !kioskCode) return;

    async function pollAuthStatus() {
      if (verifiedHandledRef.current) return;

      try {
        const result = await kioskAuthApi.selectAuthSession({
          AUTH_CODE: authCode,
          KIOSK_CODE: kioskCode,
        });

        if (!result) return;

        setAuthStatusCode(result.AUTH_STATUS_CODE);
        setAuthResultTime(result.AUTH_RESULT_TIME ?? null);

        updateBuyerCheckAuthStatus({
          AUTH_STATUS_CODE: result.AUTH_STATUS_CODE,
          AUTH_RESULT_TIME: result.AUTH_RESULT_TIME ?? "",
          AUTH_TYPE_CODE: result.AUTH_TYPE_CODE,
        });

        if (result.AUTH_STATUS_CODE === "VERIFIED") {
          verifiedHandledRef.current = true;

          if (pollingRef.current) {
            window.clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          saveBuyerCheckAuthSession({
            AUTH_CODE: result.AUTH_CODE,
            AUTH_STATUS_CODE: result.AUTH_STATUS_CODE,
            AUTH_RESULT_TIME: result.AUTH_RESULT_TIME ?? "",
            AUTH_TYPE_CODE: result.AUTH_TYPE_CODE,
            KIOSK_CODE: kioskCode,
          });

          setCompleted(true);
          setMessage(
            "인증이 완료되었습니다. 2초 후 상품 선택 화면으로 이동합니다.",
          );

          moveToProductPage(result.AUTH_CODE);
          return;
        }

        if (result.AUTH_STATUS_CODE === "EXPIRED") {
          if (pollingRef.current) {
            window.clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          clearBuyerCheckAuthSession();
          await createNewAuthSession();
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "인증 상태 조회에 실패했습니다.",
        );
      }
    }

    pollAuthStatus();

    pollingRef.current = window.setInterval(pollAuthStatus, 1000);

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      if (moveTimerRef.current) {
        window.clearTimeout(moveTimerRef.current);
        moveTimerRef.current = null;
      }
    };
  }, [authCode, kioskCode, navigate]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <img src={logoImage} alt="Loocker" className={styles.logo} />

        <button
          type="button"
          className={styles.homeButton}
          onClick={handleGoHome}
        >
          처음으로
        </button>
      </header>

      <section className={styles.authCard}>
        <h1 className={styles.title}>구매자 물품 확인 인증</h1>

        <p className={styles.description}>
          모바일 기기로 QR 코드를 스캔한 뒤 로그인해주세요.
        </p>

        <div className={styles.qrBox}>
          {loading && <div className={styles.qrPlaceholder}>확인 중...</div>}

          {!loading && qrUrl && !completed && (
            <QRCodeCanvas value={qrUrl} size={300} includeMargin />
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

        <div className={styles.authGuideBox}>
          <strong>인증 후 확인할 상품을 선택합니다.</strong>
          <span>{message}</span>
          <span>인증 상태: {authStatusCode}</span>
          {authResultTime && <span>인증 시간: {authResultTime}</span>}
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleForceMove}
          disabled={!authCode}
        >
          테스트용 상품 선택으로 이동
        </button>

        {qrUrl && !completed && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => window.open(qrUrl, "_blank")}
          >
            테스트용 모바일 로그인 페이지 열기
          </button>
        )}

        <details className={styles.devPreview}>
          <summary>QR 생성 요청값 미리보기</summary>
          <pre>{JSON.stringify(requestPreview, null, 2)}</pre>
        </details>
      </section>
    </main>
  );
}
