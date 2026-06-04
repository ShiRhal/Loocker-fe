import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import logoImage from "../../../assets/images/Loocker.png";
import cameraModuleImage from "../../../assets/images/kiosk/kiosk_camera_module.png";
import styles from "../styles/kioskBuyerCheck.module.css";

type BuyerCheckProduct = {
  PRODUCT_ID: number;
  TRADE_ID: number;
  TITLE: string;
  BASE_PRICE: number;
  PRODUCT_STATUS_CODE: string;
  IMAGE_URL?: string;
};

type BuyerLockerResult = {
  TRADE_ID: number;
  PRODUCT_ID: number;
  LOCKER_ID: number;
  LOCKER_NO: number;
};

type InspectionLocationState = {
  authCode?: string;
  kioskCode?: string;
  product?: BuyerCheckProduct;
  locker?: BuyerLockerResult;
  sellerStoredImageUrl?: string;
  currentCaptureImageUrl?: string;
};

type InspectionPhase = "PREPARING" | "COMPARE" | "DONE";

const fallbackProduct: BuyerCheckProduct = {
  PRODUCT_ID: 101,
  TRADE_ID: 9001,
  TITLE: "SONY 4K 캠코더",
  BASE_PRICE: 24332243,
  PRODUCT_STATUS_CODE: "보관 완료",
  IMAGE_URL: cameraModuleImage,
};

const fallbackLocker: BuyerLockerResult = {
  TRADE_ID: 9001,
  PRODUCT_ID: 101,
  LOCKER_ID: 2,
  LOCKER_NO: 2,
};

function formatPrice(price: number) {
  return `${price.toLocaleString()}원`;
}

export default function KioskBuyerInspectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authCode } = useParams();

  const state = (location.state || {}) as InspectionLocationState;

  const product = state.product || fallbackProduct;
  const locker = state.locker || fallbackLocker;

  const sellerStoredImageUrl =
    state.sellerStoredImageUrl || product.IMAGE_URL || cameraModuleImage;

  const currentCaptureImageUrl =
    state.currentCaptureImageUrl || product.IMAGE_URL || cameraModuleImage;

  const normalizedAuthCode =
    authCode ||
    state.authCode ||
    sessionStorage.getItem("buyerCheckAuthCode") ||
    "";

  const [phase, setPhase] = useState<InspectionPhase>("PREPARING");

  const phaseText = useMemo(() => {
    if (phase === "PREPARING") {
      return {
        title: "보관함 내부 확인을 준비 중입니다.",
        description: "조명과 필름을 켜고 현재 보관 상태를 촬영합니다.",
        subDescription:
          "테스트 화면에서는 잠시 후 자동으로 비교 화면으로 이동합니다.",
      };
    }

    if (phase === "COMPARE") {
      return {
        title: "보관된 물품을 확인해주세요.",
        description: "판매자 보관 사진과 현재 촬영 사진을 비교해주세요.",
        subDescription:
          "보관함 내부도 직접 확인한 뒤 물품이 맞으면 완료 버튼을 눌러주세요.",
      };
    }

    return {
      title: "물품 확인이 완료되었습니다.",
      description: "구매자 물품 확인 단계가 완료되었습니다.",
      subDescription: "이후 물품 수령 단계로 이어서 진행할 수 있습니다.",
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "PREPARING") return;

    const timer = window.setTimeout(() => {
      setPhase("COMPARE");
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [phase]);

  function handleGoHome() {
    navigate("/kiosk");
  }

  function handleForceCompare() {
    setPhase("COMPARE");
  }

  function handleRetryCapture() {
    setPhase("PREPARING");
  }

  function handleConfirmItem() {
    setPhase("DONE");
  }

  function handleMovePickup() {
    navigate("/kiosk/pickup", {
      state: {
        authCode: normalizedAuthCode,
        product,
        locker,
      },
    });
  }

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

      <section className={styles.inspectionCard}>
        <h1 className={styles.title}>구매자 물품 확인</h1>

        <p className={styles.description}>
          배정된 보관함의 물품이 구매한 상품과 일치하는지 확인해주세요.
        </p>

        <div className={styles.summaryBox}>
          <div className={styles.summaryProduct}>
            <div className={styles.summaryImageBox}>
              <img
                src={product.IMAGE_URL || cameraModuleImage}
                alt={product.TITLE}
                className={styles.summaryImage}
              />
            </div>

            <div className={styles.summaryInfo}>
              <span>선택 상품</span>
              <strong>{product.TITLE}</strong>
              <p>{formatPrice(product.BASE_PRICE)}</p>
            </div>
          </div>

          <div className={styles.summaryLocker}>
            <span>확인할 보관함</span>
            <strong>{locker.LOCKER_NO}번</strong>
          </div>
        </div>

        <div
          className={`${styles.inspectionPanel} ${
            phase === "DONE" ? styles.inspectionPanelDone : ""
          }`}
        >
          {phase === "PREPARING" && (
            <>
              <div className={styles.prepareImageBox}>
                <img
                  src={cameraModuleImage}
                  alt="촬영 준비"
                  className={styles.prepareImage}
                />
              </div>

              <h2>{phaseText.title}</h2>
              <p>{phaseText.description}</p>
              <span>{phaseText.subDescription}</span>

              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleForceCompare}
              >
                테스트용 비교 화면으로 이동
              </button>
            </>
          )}

          {phase === "COMPARE" && (
            <>
              <h2>{phaseText.title}</h2>
              <p>{phaseText.description}</p>

              <div className={styles.compareGrid}>
                <div className={styles.compareImageCard}>
                  <span>판매자 보관 사진</span>
                  <div className={styles.compareImageBox}>
                    <img
                      src={sellerStoredImageUrl}
                      alt="판매자 보관 사진"
                      className={styles.compareImage}
                    />
                  </div>
                </div>

                <div className={styles.compareImageCard}>
                  <span>현재 촬영 사진</span>
                  <div className={styles.compareImageBox}>
                    <img
                      src={currentCaptureImageUrl}
                      alt="현재 촬영 사진"
                      className={styles.compareImage}
                    />
                  </div>
                </div>
              </div>

              <span className={styles.compareGuide}>
                {phaseText.subDescription}
              </span>

              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleRetryCapture}
                >
                  다시 확인하기
                </button>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleConfirmItem}
                >
                  물품이 맞습니다
                </button>
              </div>
            </>
          )}

          {phase === "DONE" && (
            <>
              <div className={styles.doneCircle}>✓</div>

              <h2>{phaseText.title}</h2>
              <p>{phaseText.description}</p>
              <span>{phaseText.subDescription}</span>

              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleGoHome}
                >
                  처음으로
                </button>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleMovePickup}
                >
                  물품 수령 진행
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
