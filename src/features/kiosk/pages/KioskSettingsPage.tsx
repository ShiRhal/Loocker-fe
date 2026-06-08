import { useNavigate } from "react-router-dom";
import logoImage from "../../../assets/images/Loocker.png";
import styles from "../styles/kiosk.module.css";

export default function KioskSettingsPage() {
  const navigate = useNavigate();

  const handleClearSessionStorage = () => {
    const confirmed = window.confirm(
      "현재 브라우저의 세션스토리지를 모두 초기화하시겠습니까?",
    );

    if (!confirmed) return;

    sessionStorage.clear();

    window.alert("세션스토리지가 초기화되었습니다.");
  };

  const handleGoHome = () => {
    navigate("/kiosk", { replace: true });
  };

  return (
    <main className={styles.kioskSettingsPage}>
      <header className={styles.kioskSettingsHeader}>
        <img
          className={styles.kioskSettingsLogo}
          src={logoImage}
          alt="Loocker"
        />

        <button
          type="button"
          className={styles.kioskSettingsHomeButton}
          onClick={handleGoHome}
        >
          처음으로
        </button>
      </header>

      <section className={styles.kioskSettingsMain}>
        <div className={styles.kioskSettingsCard}>
          <h1 className={styles.kioskSettingsTitle}>키오스크 설정</h1>

          <p className={styles.kioskSettingsDescription}>
            키오스크 테스트 및 관리 기능을 사용할 수 있습니다.
          </p>

          <div className={styles.kioskSettingsButtonList}>
            <button
              type="button"
              className={styles.kioskSettingsActionButton}
              onClick={handleClearSessionStorage}
            >
              <span className={styles.kioskSettingsActionTitle}>
                세션스토리지 초기화
              </span>
              <span className={styles.kioskSettingsActionDescription}>
                현재 브라우저에 저장된 임시 키오스크 진행 정보를 모두
                삭제합니다.
              </span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
