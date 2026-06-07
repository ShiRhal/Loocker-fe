import { useNavigate, useSearchParams } from "react-router-dom";
import logoImage from "../../../assets/images/Loocker.png";
import styles from "../styles/KioskBuyerPickupPage.module.css";

export default function KioskBuyerPickupPaymentFailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code") || "";
  const failMessage =
    searchParams.get("message") || "결제에 실패했습니다. 다시 시도해주세요.";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <img className={styles.logo} src={logoImage} alt="Loocker" />

        <button
          className={styles.homeButton}
          type="button"
          onClick={() => navigate("/kiosk", { replace: true })}
        >
          처음으로
        </button>
      </header>

      <section className={styles.card}>
        <div className={styles.panel}>
          <div className={styles.errorCircle}>!</div>

          <h1>결제 실패</h1>
          <p>{failMessage}</p>
          {code && <span>오류 코드: {code}</span>}

          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => navigate("/kiosk/pickup", { replace: true })}
          >
            다시 결제하기
          </button>
        </div>
      </section>
    </main>
  );
}
