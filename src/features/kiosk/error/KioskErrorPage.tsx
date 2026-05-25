import { useLocation, useNavigate } from "react-router-dom";
import logoImage from "../../../assets/images/Loocker.png";
import styles from "../styles/kiosk.module.css";
import { clearSellerDepositSession } from "../utils/sellerDepositSession";

type ErrorPageState = {
  message?: string;
};

export default function KioskErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state || {}) as ErrorPageState;

  const message =
    state.message ||
    "요청 처리 중 오류가 발생했습니다. 처음부터 다시 진행해주세요.";

  function handleGoHome() {
    clearSellerDepositSession();
    navigate("/kiosk", { replace: true });
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
        </div>

        <h1 className={styles.loginTitle}>오류 발생</h1>

        <p className={styles.loginMessage}>{message}</p>

        <button
          className={styles.loginButton}
          type="button"
          onClick={handleGoHome}
        >
          처음으로
        </button>
      </section>
    </main>
  );
}
