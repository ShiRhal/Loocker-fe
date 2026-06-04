import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logoImage from "../../../assets/images/Loocker.png";
import styles from "../styles/KioskBuyerPickupPage.module.css";

export default function KioskBuyerPickupPaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey") || "";
    const orderId = searchParams.get("orderId") || "";
    const amount = searchParams.get("amount") || "";
    const tradeId = searchParams.get("tradeId") || "";

    const pendingPaymentRaw = sessionStorage.getItem(
      "pendingKioskPickupPayment",
    );
    const pendingPayment = pendingPaymentRaw
      ? JSON.parse(pendingPaymentRaw)
      : null;

    sessionStorage.setItem(
      "kioskPickupPaymentResult",
      JSON.stringify({
        PAYMENT_KEY: paymentKey,
        ORDER_ID: orderId,
        AMOUNT: Number(amount || pendingPayment?.amount || 0),
        TRADE_ID: Number(tradeId || pendingPayment?.tradeId || 0),
        PRODUCT_ID: Number(pendingPayment?.productId || 0),
        LOCKER_ID: Number(pendingPayment?.lockerId || 0),
        BASE_AMOUNT: Number(pendingPayment?.baseAmount || 0),
        SERVICE_FEE: Number(pendingPayment?.serviceFee || 0),
      }),
    );

    /*
      TODO 실제 API 연결 위치

      1. Payment 승인 API 호출
      await paymentApi.confirm({
        PAYMENT_KEY: paymentKey,
        ORDER_ID: orderId,
        AMOUNT: Number(amount),
        TRADE_ID: Number(tradeId),
      });

      2. 결제 성공 후 보관함 상태 전이
      PAYMENT_CONFIRMED
      BUYER_UNLOCK_REQUESTED

      3. 이후 /kiosk/pickup?paid=1 로 이동
    */

    const timer = window.setTimeout(() => {
      navigate("/kiosk/pickup?paid=1", { replace: true });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [navigate, searchParams]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <img className={styles.logo} src={logoImage} alt="Loocker" />
      </header>

      <section className={styles.card}>
        <div className={`${styles.panel} ${styles.donePanel}`}>
          <div className={styles.doneCircle}>✓</div>
          <h1>결제 인증 완료</h1>
          <p>잠시 후 보관함 수령 단계로 이동합니다.</p>
        </div>
      </section>
    </main>
  );
}
