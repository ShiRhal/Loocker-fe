import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import logoImage from "../../../assets/images/Loocker.png";
import styles from "../styles/kioskBuyerPickup.module.css";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";

declare global {
  interface Window {
    TossPayments?: any;
  }
}

type PickupStep =
  | "CHECKING"
  | "AUTH_EXPIRED"
  | "PAYMENT"
  | "OPENING"
  | "OPENED"
  | "CLOSING"
  | "DONE"
  | "ERROR";

type PickupProduct = {
  TRADE_ID: number;
  PRODUCT_ID: number;
  TITLE: string;
  BASE_PRICE: number;
  LOCKER_ID?: number;
  LOCKER_NO?: number;
  IMAGE_URL?: string | null;
};

type PickupLocationState = {
  authCode?: string;
  kioskCode?: string;
  product?: PickupProduct;
  locker?: {
    TRADE_ID: number;
    PRODUCT_ID: number;
    LOCKER_ID: number;
    LOCKER_NO: number;
  };
};

type CommandStatusResponse = {
  CHECK_STATUS?: "WAITING" | "RUNNING" | "SUCCESS" | "FAILED";
  CAN_RETRY?: boolean | string;
  FAILED_COMMAND_TYPE_CODE?: string;
  RESULT_MESSAGE?: string;
  LOCKER_STATUS?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const LOCKER_CODE =
  localStorage.getItem("LOCKER_CODE") ||
  localStorage.getItem("lockerCode") ||
  "LOCKER_001";

const TOSS_CLIENT_KEY =
  import.meta.env.VITE_TOSS_CLIENT_KEY?.trim() ||
  "test_ck_QbgMGZzorzzY5z652y7Krl5E1em4";

const TOSS_SCRIPT_URL = "https://js.tosspayments.com/v1/payment";

const FRONT_BASE_URL =
  import.meta.env.VITE_FRONT_BASE_URL ?? window.location.origin;

const STATUS_PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED";
const STATUS_BUYER_UNLOCK_REQUESTED = "BUYER_UNLOCK_REQUESTED";
const STATUS_BUYER_UNLOCK_READY = "BUYER_UNLOCK_READY";
const STATUS_BUYER_PICKUP_DONE = "BUYER_PICKUP_DONE";
const STATUS_PICKUP_LOCKED_EMPTY_READY = "PICKUP_LOCKED_EMPTY_READY";

function loadTossScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.TossPayments) {
      resolve();
      return;
    }

    const existed = document.querySelector<HTMLScriptElement>(
      `script[src="${TOSS_SCRIPT_URL}"]`,
    );

    if (existed) {
      existed.addEventListener("load", () => resolve());
      existed.addEventListener("error", () =>
        reject(new Error("Toss 스크립트 로드 실패")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TOSS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Toss 스크립트 로드 실패"));

    document.body.appendChild(script);
  });
}

function formatPrice(value?: number) {
  if (typeof value !== "number") return "-";
  return `${value.toLocaleString()}원`;
}

function createOrderId(tradeId: number) {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `LOCKER_${tradeId}_${Date.now()}_${random}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildApiUrl(path: string, params?: Record<string, string | number>) {
  const normalizedBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const url = new URL(
    `${normalizedBase}${normalizedPath}`,
    window.location.origin,
  );

  Object.entries(params || {}).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function requestJson<T>(
  path: string,
  options?: RequestInit,
  params?: Record<string, string | number>,
): Promise<T> {
  const response = await fetch(buildApiUrl(path, params), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const text = await response.text();

  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : `요청에 실패했습니다. status=${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

function unwrapResponse<T>(response: unknown): T {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    (response as { data?: unknown }).data
  ) {
    return (response as { data: T }).data;
  }

  if (
    typeof response === "object" &&
    response !== null &&
    "result" in response &&
    (response as { result?: unknown }).result
  ) {
    return (response as { result: T }).result;
  }

  return response as T;
}

function getSessionNumber(keys: string[], fallback: number) {
  for (const key of keys) {
    const value = Number(sessionStorage.getItem(key) || "");

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return fallback;
}

function getSessionText(keys: string[], fallback: string) {
  for (const key of keys) {
    const value = sessionStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return fallback;
}

function getPickupProductFromSession(): PickupProduct {
  const tradeId = getSessionNumber(
    ["buyerPickupTradeId", "buyerCheckTradeId", "buyerInspectionTradeId"],
    1,
  );

  const productId = getSessionNumber(
    ["buyerPickupProductId", "buyerCheckProductId", "buyerInspectionProductId"],
    1,
  );

  const title = getSessionText(
    [
      "buyerPickupProductTitle",
      "buyerCheckProductTitle",
      "buyerInspectionProductTitle",
    ],
    "테스트 상품",
  );

  const price = getSessionNumber(
    [
      "buyerPickupProductPrice",
      "buyerCheckProductPrice",
      "buyerInspectionProductPrice",
    ],
    1000,
  );

  const lockerId = getSessionNumber(
    ["buyerPickupLockerId", "buyerCheckLockerId", "buyerInspectionLockerId"],
    1,
  );

  const lockerNo = getSessionNumber(
    ["buyerPickupLockerNo", "buyerCheckLockerNo", "buyerInspectionLockerNo"],
    lockerId,
  );

  const imageUrl = getSessionText(
    [
      "buyerPickupProductImageUrl",
      "buyerCheckProductImageUrl",
      "buyerInspectionProductImageUrl",
    ],
    "",
  );

  return {
    TRADE_ID: tradeId,
    PRODUCT_ID: productId,
    TITLE: title,
    BASE_PRICE: price,
    LOCKER_ID: lockerId,
    LOCKER_NO: lockerNo,
    IMAGE_URL: imageUrl,
  };
}

function getCustomerName() {
  return (
    localStorage.getItem("nickname") ||
    localStorage.getItem("userNickname") ||
    localStorage.getItem("NICKNAME") ||
    "구매자"
  );
}

export default function KioskBuyerPickupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const state = (location.state || {}) as PickupLocationState;

  const product = useMemo<PickupProduct>(() => {
    const sessionProduct = getPickupProductFromSession();

    if (!state.product) {
      return sessionProduct;
    }

    return {
      ...sessionProduct,
      ...state.product,
      TRADE_ID: state.locker?.TRADE_ID || state.product.TRADE_ID,
      PRODUCT_ID: state.locker?.PRODUCT_ID || state.product.PRODUCT_ID,
      LOCKER_ID: state.locker?.LOCKER_ID || state.product.LOCKER_ID,
      LOCKER_NO: state.locker?.LOCKER_NO || state.product.LOCKER_NO,
    };
  }, [state.product, state.locker]);

  const normalizedAuthCode =
    state.authCode ||
    sessionStorage.getItem("buyerPickupAuthCode") ||
    sessionStorage.getItem("buyerCheckAuthCode") ||
    sessionStorage.getItem("buyerInspectionAuthCode") ||
    "";

  const normalizedKioskCode =
    state.kioskCode ||
    localStorage.getItem("KIOSK_CODE") ||
    localStorage.getItem("kioskCode") ||
    sessionStorage.getItem("kioskCode") ||
    "";

  const tradeId = product.TRADE_ID;
  const lockerId = product.LOCKER_ID || 0;

  const [step, setStep] = useState<PickupStep>("CHECKING");
  const [message, setMessage] = useState("수령 가능 상태를 확인하고 있습니다.");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const openingStartedRef = useRef(false);
  const isPaidRedirect = searchParams.get("paid") === "1";

  const productImageUrl = product.IMAGE_URL
    ? toApiAssetUrl(product.IMAGE_URL)
    : "";

  const lockerNo = product.LOCKER_NO || product.LOCKER_ID || "-";

  const serviceFee = Math.floor(product.BASE_PRICE * 0.05);
  const totalPaymentAmount = product.BASE_PRICE + serviceFee;

  const qrUrl = normalizedAuthCode
    ? `${window.location.origin}/m/login/${normalizedAuthCode}`
    : `${window.location.origin}/m/login`;

  async function updateLockerState(
    nextStatus: string,
    roleType: "KIOSK" | "DEVICE",
  ) {
    await requestJson("/kiosk/locker/update", {
      method: "PUT",
      body: JSON.stringify({
        TRADE_ID: tradeId,
        AUTH_CODE: normalizedAuthCode,
        NEXT_STATUS: nextStatus,
        ROLE_TYPE: roleType,
        RESULT_STATUS_CODE: "",
      }),
    });
  }

  async function createLockerCommand(
    nextStatus: string,
    requestTypeCode: "NORMAL" | "RETRY" = "NORMAL",
  ) {
    await requestJson("/kiosk/locker/command/create", {
      method: "PUT",
      body: JSON.stringify({
        AUTH_CODE: normalizedAuthCode,
        KIOSK_CODE: normalizedKioskCode,
        NEXT_STATUS: nextStatus,
        REQUEST_TYPE_CODE: requestTypeCode,
      }),
    });
  }

  async function selectCommandStatus(lockerStatusName: string) {
    const response = await requestJson<CommandStatusResponse>(
      "/kiosk/locker/command/status/select",
      {
        method: "GET",
      },
      {
        LOCKER_CODE,
        KIOSK_CODE: normalizedKioskCode,
        TRADE_ID: tradeId,
        LOCKER_ID: lockerId,
        LOCKER_STATUS_NAME: lockerStatusName,
      },
    );

    return unwrapResponse<CommandStatusResponse>(response);
  }

  async function waitUntilCommandSuccess(lockerStatusName: string) {
    const maxTryCount = 30;

    for (let i = 0; i < maxTryCount; i += 1) {
      const status = await selectCommandStatus(lockerStatusName);

      if (status.CHECK_STATUS === "SUCCESS") {
        return status;
      }

      if (status.CHECK_STATUS === "FAILED") {
        throw new Error(
          status.RESULT_MESSAGE ||
            `${status.FAILED_COMMAND_TYPE_CODE || lockerStatusName} 명령이 실패했습니다.`,
        );
      }

      await sleep(1000);
    }

    throw new Error("라즈베리파이 명령 성공 확인 시간이 초과되었습니다.");
  }

  function validateRequiredData() {
    if (!normalizedAuthCode) {
      throw new Error(
        "AUTH_CODE가 없습니다. 구매자 인증부터 다시 진행해주세요.",
      );
    }

    if (!normalizedKioskCode) {
      throw new Error(
        "KIOSK_CODE가 없습니다. 키오스크 로그인을 다시 진행해주세요.",
      );
    }

    if (!tradeId || !lockerId) {
      throw new Error(
        "TRADE_ID 또는 LOCKER_ID가 없습니다. 거래 정보를 다시 확인해주세요.",
      );
    }
  }

  async function startPickupAfterPayment(
    requestTypeCode: "NORMAL" | "RETRY" = "NORMAL",
  ) {
    try {
      validateRequiredData();

      setIsProcessing(true);
      setStep("OPENING");
      setMessage("결제가 확인되었습니다. 보관함 문을 여는 중입니다.");

      await updateLockerState(STATUS_PAYMENT_CONFIRMED, "KIOSK");

      await createLockerCommand(STATUS_BUYER_UNLOCK_REQUESTED, requestTypeCode);

      await sleep(1000);

      await waitUntilCommandSuccess(STATUS_BUYER_UNLOCK_REQUESTED);

      await updateLockerState(STATUS_BUYER_UNLOCK_READY, "DEVICE");

      setStep("OPENED");
      setMessage("보관함 문이 열렸습니다. 물품을 수령해주세요.");
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "보관함 문 열림 처리 중 알 수 없는 오류가 발생했습니다.";

      setStep("ERROR");
      setMessage(nextMessage);
    } finally {
      setIsProcessing(false);
    }
  }

  async function completePickup() {
    try {
      validateRequiredData();

      setIsProcessing(true);
      setStep("CLOSING");
      setMessage("문 닫힘을 확인하고 있습니다.");

      await updateLockerState(STATUS_BUYER_PICKUP_DONE, "KIOSK");

      await createLockerCommand(STATUS_BUYER_PICKUP_DONE, "NORMAL");

      await sleep(1000);

      await waitUntilCommandSuccess(STATUS_BUYER_PICKUP_DONE);

      await updateLockerState(STATUS_PICKUP_LOCKED_EMPTY_READY, "DEVICE");

      setStep("DONE");
      setMessage(
        "수령이 완료되었습니다. 보관함이 비어 있음 상태로 초기화됩니다.",
      );
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "수령 완료 처리 중 알 수 없는 오류가 발생했습니다.";

      setStep("ERROR");
      setMessage(nextMessage);
    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    if (isPaidRedirect) {
      if (openingStartedRef.current) return;

      openingStartedRef.current = true;
      startPickupAfterPayment("NORMAL");
      return;
    }

    const timer = window.setTimeout(() => {
      const authStatus =
        sessionStorage.getItem("buyerPickupAuthStatus") ||
        sessionStorage.getItem("buyerCheckAuthStatus") ||
        sessionStorage.getItem("buyerInspectionAuthStatus") ||
        "VERIFIED";

      if (authStatus === "EXPIRED") {
        setStep("AUTH_EXPIRED");
        setMessage("인증 시간이 만료되었습니다. QR 인증을 다시 진행해주세요.");
        return;
      }

      setStep("PAYMENT");
      setMessage("결제 후 물품 수령을 진행해주세요.");
    }, 700);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaidRedirect]);

  function handleGoHome() {
    navigate("/kiosk", { replace: true });
  }

  function handleForceAuthComplete() {
    if (normalizedAuthCode) {
      sessionStorage.setItem("buyerPickupAuthCode", normalizedAuthCode);
    }

    sessionStorage.setItem("buyerPickupAuthStatus", "VERIFIED");

    setStep("PAYMENT");
    setMessage("테스트 인증 완료 상태입니다. 결제를 진행해주세요.");
  }

  async function handleRequestPayment() {
    try {
      setPaymentLoading(true);
      setMessage("");

      await loadTossScript();

      if (!window.TossPayments) {
        throw new Error("TossPayments 객체를 찾을 수 없습니다.");
      }

      const orderId = createOrderId(product.TRADE_ID);
      const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);

      sessionStorage.setItem(
        "pendingKioskPickupPayment",
        JSON.stringify({
          productId: product.PRODUCT_ID,
          tradeId: product.TRADE_ID,
          lockerId: product.LOCKER_ID,
          baseAmount: product.BASE_PRICE,
          serviceFee,
          amount: totalPaymentAmount,
          orderId,
          createdAt: Date.now(),
        }),
      );

      await tossPayments.requestPayment("카드", {
        amount: totalPaymentAmount,
        orderId,
        orderName: `${product.TITLE} 보관함 거래 결제`,
        customerName: getCustomerName(),
        successUrl: `${FRONT_BASE_URL}/kiosk/pickup?paid=1&tradeId=${product.TRADE_ID}`,
        failUrl: `${FRONT_BASE_URL}/kiosk/pickup?paid=0&tradeId=${product.TRADE_ID}`,
      });
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "결제창이 닫혔거나 결제가 중단되었습니다.",
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  function handleForcePaymentSuccess() {
    const orderId = createOrderId(product.TRADE_ID);

    sessionStorage.setItem(
      "pendingKioskPickupPayment",
      JSON.stringify({
        productId: product.PRODUCT_ID,
        tradeId: product.TRADE_ID,
        lockerId: product.LOCKER_ID,
        baseAmount: product.BASE_PRICE,
        serviceFee,
        amount: totalPaymentAmount,
        orderId,
        createdAt: Date.now(),
      }),
    );

    openingStartedRef.current = true;
    startPickupAfterPayment("NORMAL");
  }

  function handlePickupDone() {
    completePickup();
  }

  function handleRetry() {
    if (step === "OPENING") {
      startPickupAfterPayment("RETRY");
      return;
    }

    setStep("PAYMENT");
    setMessage("결제 후 물품 수령을 다시 진행해주세요.");
  }

  function handleFinish() {
    sessionStorage.removeItem("buyerPickupAuthCode");
    sessionStorage.removeItem("buyerPickupAuthStatus");
    sessionStorage.removeItem("buyerPickupTradeId");
    sessionStorage.removeItem("buyerPickupProductId");
    sessionStorage.removeItem("buyerPickupProductTitle");
    sessionStorage.removeItem("buyerPickupProductPrice");
    sessionStorage.removeItem("buyerPickupProductImageUrl");
    sessionStorage.removeItem("buyerPickupLockerId");
    sessionStorage.removeItem("buyerPickupLockerNo");
    sessionStorage.removeItem("pendingKioskPickupPayment");
    sessionStorage.removeItem("kioskPickupPaymentResult");

    navigate("/kiosk", { replace: true });
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <img className={styles.logo} src={logoImage} alt="Loocker" />

        <button
          className={styles.homeButton}
          type="button"
          onClick={handleGoHome}
        >
          처음으로
        </button>
      </header>

      <section className={styles.card}>
        <div className={styles.summaryBox}>
          <div className={styles.summaryProduct}>
            <div className={styles.summaryImageBox}>
              {productImageUrl ? (
                <img
                  className={styles.summaryImage}
                  src={productImageUrl}
                  alt={product.TITLE}
                />
              ) : (
                <div className={styles.noImage}>NO IMAGE</div>
              )}
            </div>

            <div className={styles.summaryInfo}>
              <span>수령 상품</span>
              <strong>{product.TITLE}</strong>
              <p>{formatPrice(product.BASE_PRICE)}</p>
            </div>
          </div>

          <div className={styles.summaryLocker}>
            <span>보관함 번호</span>
            <strong>{lockerNo}번</strong>
          </div>
        </div>

        {step === "CHECKING" && (
          <div className={styles.panel}>
            <div className={styles.loadingCircle} />
            <h1>수령 상태 확인 중</h1>
            <p>{message}</p>
          </div>
        )}

        {step === "AUTH_EXPIRED" && (
          <div className={styles.panel}>
            <div className={styles.qrBox}>
              <QRCodeCanvas value={qrUrl} size={230} includeMargin />
            </div>

            <h1>인증이 만료되었습니다</h1>
            <p>모바일에서 QR 인증을 다시 진행해주세요.</p>
            <span>
              현재는 UI 테스트 단계이므로 강제 인증 완료 버튼으로 이동할 수
              있습니다.
            </span>

            <button
              className={styles.primaryButton}
              type="button"
              onClick={handleForceAuthComplete}
            >
              테스트용 인증 완료
            </button>
          </div>
        )}

        {step === "PAYMENT" && (
          <div className={styles.paymentPanel}>
            <h1>결제 후 수령하기</h1>
            <p>결제가 완료되면 보관함 문이 열립니다.</p>

            <div className={styles.paymentReceiptBox}>
              <div className={styles.paymentLine}>
                <span>상품 금액</span>
                <strong>{formatPrice(product.BASE_PRICE)}</strong>
              </div>

              <div className={styles.paymentLine}>
                <span>보관함 거래 수수료 5%</span>
                <strong>{formatPrice(serviceFee)}</strong>
              </div>

              <div className={`${styles.paymentLine} ${styles.paymentTotal}`}>
                <span>최종 결제금액</span>
                <strong>{formatPrice(totalPaymentAmount)}</strong>
              </div>
            </div>

            <div className={styles.paymentNotice}>
              <strong>Toss Payments</strong>
              <span>버튼을 누르면 토스 결제창이 호출됩니다.</span>
            </div>

            {message && <p className={styles.message}>{message}</p>}

            <div className={styles.buttonRow}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={handleForcePaymentSuccess}
                disabled={paymentLoading || isProcessing}
              >
                테스트 결제 완료
              </button>

              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleRequestPayment}
                disabled={paymentLoading || isProcessing}
              >
                {paymentLoading ? "결제 요청 중..." : "토스 결제하기"}
              </button>
            </div>
          </div>
        )}

        {step === "OPENING" && (
          <div className={styles.panel}>
            <div className={styles.doorIcon}>
              <span />
            </div>

            <h1>보관함 문을 여는 중입니다</h1>
            <p>{message}</p>
          </div>
        )}

        {step === "OPENED" && (
          <div className={styles.panel}>
            <div className={styles.openDoorIcon}>
              <span />
            </div>

            <h1>보관함 문이 열렸습니다</h1>
            <p>물품을 꺼낸 뒤 문을 닫아주세요.</p>
            <span>수령이 끝나면 아래 버튼을 눌러주세요.</span>

            <button
              className={styles.primaryButton}
              type="button"
              onClick={handlePickupDone}
              disabled={isProcessing}
            >
              {isProcessing ? "처리 중..." : "물품을 수령했습니다"}
            </button>
          </div>
        )}

        {step === "CLOSING" && (
          <div className={styles.panel}>
            <div className={styles.closedDoorIcon}>
              <span />
            </div>

            <h1>문 닫힘 확인 중</h1>
            <p>{message}</p>
          </div>
        )}

        {step === "DONE" && (
          <div className={`${styles.panel} ${styles.donePanel}`}>
            <div className={styles.doneCircle}>✓</div>

            <h1>수령 완료</h1>
            <p>거래 수령 처리가 완료되었습니다.</p>
            <span>보관함은 비어 있음 상태로 변경됩니다.</span>

            <button
              className={styles.primaryButton}
              type="button"
              onClick={handleFinish}
            >
              처음으로 돌아가기
            </button>
          </div>
        )}

        {step === "ERROR" && (
          <div className={styles.panel}>
            <div className={styles.doneCircle}>!</div>

            <h1>수령 처리 중 오류가 발생했습니다</h1>
            <p>{message}</p>
            <span>
              명령 상태 또는 보관함 상태를 확인한 뒤 다시 시도해주세요.
            </span>

            <div className={styles.buttonRow}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={handleGoHome}
              >
                처음으로
              </button>

              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleRetry}
                disabled={isProcessing}
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
