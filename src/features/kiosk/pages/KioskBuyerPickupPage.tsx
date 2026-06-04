import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  | "DONE";

type PickupProduct = {
  TRADE_ID: number;
  PRODUCT_ID: number;
  TITLE: string;
  BASE_PRICE: number;
  LOCKER_ID?: number;
  LOCKER_NO?: number;
  IMAGE_URL?: string | null;
};

const AUTH_TYPE_CODE = "BUYER_PICKUP";

const TOSS_CLIENT_KEY =
  import.meta.env.VITE_TOSS_CLIENT_KEY?.trim() ||
  "test_ck_QbgMGZzorzzY5z652y7Krl5E1em4";

const TOSS_SCRIPT_URL = "https://js.tosspayments.com/v1/payment";

const FRONT_BASE_URL =
  import.meta.env.VITE_FRONT_BASE_URL ?? window.location.origin;

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

function makeFakeAuthCode() {
  return `BUYER_PICKUP_${Date.now().toString(36).toUpperCase()}`;
}

export default function KioskBuyerPickupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const product = useMemo(() => getPickupProductFromSession(), []);
  const authCode = useMemo(() => makeFakeAuthCode(), []);

  const [step, setStep] = useState<PickupStep>("CHECKING");
  const [message, setMessage] = useState("수령 가능 상태를 확인하고 있습니다.");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const isPaidRedirect = searchParams.get("paid") === "1";

  const productImageUrl = product.IMAGE_URL
    ? toApiAssetUrl(product.IMAGE_URL)
    : "";

  const lockerNo = product.LOCKER_NO || product.LOCKER_ID || "-";

  const serviceFee = Math.floor(product.BASE_PRICE * 0.05);
  const totalPaymentAmount = product.BASE_PRICE + serviceFee;

  const qrUrl = `${window.location.origin}/m/login/${authCode}`;

  useEffect(() => {
    if (isPaidRedirect) {
      setStep("OPENING");
      setMessage("결제가 확인되었습니다. 보관함 문을 여는 중입니다.");

      const timer = window.setTimeout(() => {
        setStep("OPENED");
        setMessage("보관함 문이 열렸습니다. 물품을 수령해주세요.");
      }, 2000);

      return () => window.clearTimeout(timer);
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
  }, [isPaidRedirect]);

  function handleGoHome() {
    navigate("/kiosk", { replace: true });
  }

  function handleForceAuthComplete() {
    sessionStorage.setItem("buyerPickupAuthCode", authCode);
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
        successUrl: `${FRONT_BASE_URL}/kiosk/pickup/payment/success?tradeId=${product.TRADE_ID}`,
        failUrl: `${FRONT_BASE_URL}/kiosk/pickup/payment/fail?tradeId=${product.TRADE_ID}`,
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

    setStep("OPENING");
    setMessage("테스트 결제 완료 처리되었습니다. 보관함 문을 여는 중입니다.");

    window.setTimeout(() => {
      setStep("OPENED");
      setMessage("보관함 문이 열렸습니다. 물품을 수령해주세요.");
    }, 2000);
  }

  function handlePickupDone() {
    setStep("CLOSING");
    setMessage("문 닫힘을 확인하고 있습니다.");

    window.setTimeout(() => {
      setStep("DONE");
      setMessage(
        "수령이 완료되었습니다. 보관함이 비어 있음 상태로 초기화됩니다.",
      );
    }, 2000);
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
                disabled={paymentLoading}
              >
                테스트 결제 완료
              </button>

              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleRequestPayment}
                disabled={paymentLoading}
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
            >
              물품을 수령했습니다
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
      </section>
    </main>
  );
}
