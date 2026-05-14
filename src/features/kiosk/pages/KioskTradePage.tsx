import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { kioskApi, type KioskTradeVerifyResponse } from "../api/kioskApi";
import styles from "../styles/kiosk.module.css";

export default function KioskTradePage() {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const trade = location.state as KioskTradeVerifyResponse | null;
  const numericTradeId = Number(tradeId);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleOpenLocker() {
    try {
      setLoading(true);
      setMessage("");

      await kioskApi.openLocker(numericTradeId);
      setMessage("보관함이 열렸습니다. 물품을 넣거나 수령해주세요.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "보관함을 열 수 없습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseCheck() {
    try {
      setLoading(true);
      setMessage("");

      await kioskApi.checkLockerClosed(numericTradeId);
      setMessage("문 닫힘이 확인되었습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "문 닫힘 확인에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>보관함 거래 진행</h1>

        <div className={styles.infoBox}>
          <p>거래 ID: {numericTradeId}</p>
          <p>상품명: {trade?.TITLE ?? "거래 정보 없음"}</p>
          <p>상태: {trade?.STATUS_CODE ?? "-"}</p>
          <p>보관함: {trade?.LOCKER_NAME ?? "-"}</p>
        </div>

        {message && <p className={styles.message}>{message}</p>}

        <button
          className={styles.primaryButton}
          onClick={handleOpenLocker}
          disabled={loading}
        >
          보관함 열기
        </button>

        <button
          className={styles.secondaryButton}
          onClick={handleCloseCheck}
          disabled={loading}
        >
          문 닫힘 확인
        </button>

        <button
          className={styles.backButton}
          onClick={() => navigate("/kiosk")}
        >
          처음으로
        </button>
      </section>
    </main>
  );
}
