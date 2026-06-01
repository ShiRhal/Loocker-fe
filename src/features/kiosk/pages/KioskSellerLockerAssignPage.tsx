import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logoImage from "../../../assets/images/Loocker.png";
import styles from "../styles/kiosk.module.css";

type LockerAssignState = {
  TRADE_ID?: number;
  PRODUCT_ID?: number;
  TITLE?: string;
  PRODUCT_TITLE?: string;
  IMAGE_URL?: string;
  PRODUCT_IMAGE_URL?: string;
  THUMBNAIL_URL?: string;
  PRODUCT_IMG?: string;
  LOCKER_ID?: number;
  LOCKER_NO?: number;
  LOCKER_STATUS_CODE?: string;
  LOCKER_STATUS?: string;
};

type DepositPhaseId =
  | "OPENING"
  | "OPENED"
  | "CLOSING_CHECK"
  | "PHOTO_TAKING"
  | "PHOTO_CONFIRM"
  | "DONE";

type DepositPhase = {
  id: DepositPhaseId;
  stepLabel: string;
  title: string;
  description: string;
  subDescription?: string;
  progressIndex: number;
  tone: "blue" | "green" | "orange" | "purple";
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const DEFAULT_CAPTURE_IMAGE_URL =
  "https://picsum.photos/seed/loocker-kiosk-capture/1280/720";

const depositPhases: Record<DepositPhaseId, DepositPhase> = {
  OPENING: {
    id: "OPENING",
    stepLabel: "문 열림",
    title: "보관함 문을 여는 중입니다.",
    description: "잠시만 기다려주세요.",
    subDescription: "보관함이 열리면 물품 보관 안내 화면으로 이동합니다.",
    progressIndex: 0,
    tone: "blue",
  },
  OPENED: {
    id: "OPENED",
    stepLabel: "물품 보관",
    title: "문이 열렸습니다.",
    description: "물건을 보관함 안에 넣고 문을 닫아주세요.",
    subDescription: "문이 안 열릴 경우 재시도 버튼을 클릭해주세요.",
    progressIndex: 1,
    tone: "green",
  },
  CLOSING_CHECK: {
    id: "CLOSING_CHECK",
    stepLabel: "문 확인",
    title: "문 닫힘을 확인하고 있습니다.",
    description: "문이 완전히 닫혔는지 확인 중입니다.",
    subDescription: "확인이 완료되면 자동으로 사진 촬영 단계로 이동합니다.",
    progressIndex: 2,
    tone: "orange",
  },
  PHOTO_TAKING: {
    id: "PHOTO_TAKING",
    stepLabel: "사진 촬영",
    title: "보관 사진을 촬영하고 있습니다.",
    description: "물품 보관 상태를 기록하고 있습니다.",
    subDescription: "촬영이 완료되면 사진 확인 화면으로 이동합니다.",
    progressIndex: 3,
    tone: "blue",
  },
  PHOTO_CONFIRM: {
    id: "PHOTO_CONFIRM",
    stepLabel: "사진 확인",
    title: "촬영된 사진을 확인해주세요.",
    description: "보관 상태가 잘 보이는지 확인한 뒤 완료 버튼을 눌러주세요.",
    progressIndex: 3,
    tone: "purple",
  },
  DONE: {
    id: "DONE",
    stepLabel: "완료",
    title: "물품 보관이 완료되었습니다.",
    description: "판매자 입고 단계가 완료되었습니다.",
    subDescription: "이제 구매자가 물품 확인 단계를 진행할 수 있습니다.",
    progressIndex: 4,
    tone: "green",
  },
};

const panelClassMap: Record<DepositPhase["tone"], string> = {
  blue: styles.kioskDepositPanelBlue,
  green: styles.kioskDepositPanelGreen,
  orange: styles.kioskDepositPanelOrange,
  purple: styles.kioskDepositPanelPurple,
};

const progressClassMap: Record<number, string> = {
  0: styles.kioskDepositProgressFill0,
  1: styles.kioskDepositProgressFill25,
  2: styles.kioskDepositProgressFill50,
  3: styles.kioskDepositProgressFill75,
  4: styles.kioskDepositProgressFill100,
};

function toApiAssetUrl(url?: string | null) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url}`;
}

function getProductTitle(data?: LockerAssignState | null) {
  if (!data) return "-";
  return data.PRODUCT_TITLE || data.TITLE || "-";
}

function getProductImageUrl(data?: LockerAssignState | null) {
  if (!data) return "";

  return (
    data.IMAGE_URL ||
    data.PRODUCT_IMAGE_URL ||
    data.THUMBNAIL_URL ||
    data.PRODUCT_IMG ||
    ""
  );
}

function PhaseVisual({ phaseId }: { phaseId: DepositPhaseId }) {
  if (phaseId === "OPENING") {
    return (
      <svg viewBox="0 0 220 160" aria-hidden="true">
        <rect x="54" y="22" width="112" height="116" rx="18" fill="#eef4ff" />
        <rect
          x="68"
          y="36"
          width="74"
          height="88"
          rx="12"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="7"
        />
        <path
          d="M142 40 L178 26 V116 L142 124 Z"
          fill="#dbeafe"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <circle cx="126" cy="80" r="5" fill="currentColor" />
        <path
          d="M38 80 H16 M45 55 L28 38 M45 105 L28 122"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M180 48 C194 58 200 70 200 82"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (phaseId === "OPENED") {
    return (
      <svg viewBox="0 0 220 160" aria-hidden="true">
        <rect x="52" y="28" width="98" height="104" rx="18" fill="#ecfdf5" />
        <rect
          x="68"
          y="42"
          width="70"
          height="76"
          rx="12"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="7"
        />
        <path
          d="M138 42 L188 20 V106 L138 118 Z"
          fill="#dcfce7"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <rect x="82" y="80" width="44" height="30" rx="7" fill="#93c5fd" />
        <path
          d="M82 80 L104 64 L126 80"
          fill="#bfdbfe"
          stroke="#2563eb"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M104 64 V110"
          stroke="#2563eb"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="124" cy="79" r="5" fill="currentColor" />
      </svg>
    );
  }

  if (phaseId === "CLOSING_CHECK") {
    return (
      <svg viewBox="0 0 220 160" aria-hidden="true">
        <rect
          x="58"
          y="26"
          width="104"
          height="108"
          rx="20"
          fill="#fff7ed"
          stroke="currentColor"
          strokeWidth="7"
        />
        <rect x="76" y="44" width="68" height="72" rx="13" fill="#ffffff" />
        <path
          d="M86 81 L104 99 L136 61"
          fill="none"
          stroke="#16a34a"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M42 48 C28 68 28 92 42 112"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M178 48 C192 68 192 92 178 112"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (phaseId === "PHOTO_TAKING") {
    return (
      <svg viewBox="0 0 220 160" aria-hidden="true">
        <rect
          x="58"
          y="40"
          width="104"
          height="86"
          rx="18"
          fill="#eff6ff"
          stroke="currentColor"
          strokeWidth="7"
        />
        <path
          d="M86 40 L94 24 H126 L134 40"
          fill="#dbeafe"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <circle
          cx="110"
          cy="83"
          r="25"
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth="7"
        />
        <circle cx="110" cy="83" r="10" fill="currentColor" />
        <circle cx="145" cy="59" r="5" fill="currentColor" />
        <path
          d="M40 32 L28 20 M180 32 L192 20 M110 18 V6"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (phaseId === "DONE") {
    return (
      <svg viewBox="0 0 220 160" aria-hidden="true">
        <rect
          x="62"
          y="32"
          width="96"
          height="96"
          rx="20"
          fill="#ecfdf5"
          stroke="currentColor"
          strokeWidth="7"
        />
        <path
          d="M84 80 L104 101 L138 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M70 32 L110 14 L150 32"
          fill="#dcfce7"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return null;
}

export default function KioskSellerDepositLockerAssignPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const assignData = (location.state || {}) as LockerAssignState;

  const [phaseId, setPhaseId] = useState<DepositPhaseId>("OPENING");

  const currentPhase = depositPhases[phaseId];

  const productTitle = getProductTitle(assignData);
  const productImageUrl = toApiAssetUrl(getProductImageUrl(assignData));
  const lockerNo = assignData.LOCKER_NO || assignData.LOCKER_ID || "-";

  const captureImageUrl = productImageUrl || DEFAULT_CAPTURE_IMAGE_URL;

  const progressFillClass = useMemo(() => {
    return progressClassMap[currentPhase.progressIndex];
  }, [currentPhase.progressIndex]);

  useEffect(() => {
    let timer: number | null = null;

    if (phaseId === "OPENING") {
      timer = window.setTimeout(() => {
        setPhaseId("OPENED");
      }, 1800);
    }

    if (phaseId === "OPENED") {
      timer = window.setTimeout(() => {
        setPhaseId("CLOSING_CHECK");
      }, 5200);
    }

    if (phaseId === "CLOSING_CHECK") {
      timer = window.setTimeout(() => {
        setPhaseId("PHOTO_TAKING");
      }, 2600);
    }

    if (phaseId === "PHOTO_TAKING") {
      timer = window.setTimeout(() => {
        setPhaseId("PHOTO_CONFIRM");
      }, 2600);
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [phaseId]);

  function handleGoHome() {
    navigate("/kiosk");
  }

  function handleRetryOpen() {
    setPhaseId("OPENING");
  }

  function handleConfirmPhoto() {
    setPhaseId("DONE");
  }

  function handleReplayFlow() {
    setPhaseId("OPENING");
  }

  return (
    <div className={styles.kioskDepositPage}>
      <header className={styles.kioskDepositHeader}>
        <img src={logoImage} alt="루커" className={styles.kioskDepositLogo} />

        <button
          type="button"
          className={styles.kioskDepositHomeButton}
          onClick={handleGoHome}
        >
          처음으로
        </button>
      </header>

      <main className={styles.kioskDepositMain}>
        <section className={styles.kioskDepositCard}>
          <h1 className={styles.kioskDepositTitle}>판매자 물품 보관</h1>

          <p className={styles.kioskDepositDescription}>
            배정된 보관함에 물품을 보관해주세요.
          </p>

          <div className={styles.kioskDepositProductBox}>
            <div className={styles.kioskDepositProductImageBox}>
              {productImageUrl ? (
                <img
                  src={productImageUrl}
                  alt={productTitle}
                  className={styles.kioskDepositProductImage}
                />
              ) : (
                <div className={styles.kioskDepositNoImage}>이미지 없음</div>
              )}
            </div>

            <div className={styles.kioskDepositProductInfo}>
              <span>선택 상품</span>
              <strong>{productTitle}</strong>
            </div>
          </div>

          <div className={styles.kioskDepositLockerBox}>
            <p className={styles.kioskDepositLockerLabel}>지정된 보관함</p>

            <strong className={styles.kioskDepositLockerNumber}>
              {lockerNo}번
            </strong>

            <div className={styles.kioskDepositProgressTrack}>
              <div
                className={`${styles.kioskDepositProgressFill} ${progressFillClass}`}
              />
            </div>

            <p className={styles.kioskDepositCurrentStep}>
              현재 단계: {currentPhase.stepLabel}
            </p>
          </div>

          <div
            className={`${styles.kioskDepositPanel} ${
              panelClassMap[currentPhase.tone]
            }`}
          >
            {phaseId !== "PHOTO_CONFIRM" && (
              <div className={styles.kioskDepositVisual}>
                <PhaseVisual phaseId={phaseId} />
              </div>
            )}

            {phaseId === "PHOTO_CONFIRM" && (
              <div className={styles.kioskDepositCaptureBox}>
                <img
                  src={captureImageUrl}
                  alt="임시 촬영 이미지"
                  className={styles.kioskDepositCaptureImage}
                />
              </div>
            )}

            <h2 className={styles.kioskDepositPanelTitle}>
              {currentPhase.title}
            </h2>

            <p className={styles.kioskDepositPanelDescription}>
              {currentPhase.description}
            </p>

            {currentPhase.subDescription && (
              <p className={styles.kioskDepositPanelSubDescription}>
                {currentPhase.subDescription}
              </p>
            )}

            {phaseId === "OPENED" && (
              <button
                type="button"
                className={styles.kioskDepositRetryButton}
                onClick={handleRetryOpen}
              >
                문 열림 재시도
              </button>
            )}

            {phaseId === "PHOTO_CONFIRM" && (
              <button
                type="button"
                className={styles.kioskDepositPrimaryButton}
                onClick={handleConfirmPhoto}
              >
                사진 확인 완료
              </button>
            )}

            {phaseId === "DONE" && (
              <button
                type="button"
                className={styles.kioskDepositPrimaryButton}
                onClick={handleGoHome}
              >
                처음으로
              </button>
            )}
          </div>

          <button
            type="button"
            className={styles.kioskDepositReplayButton}
            onClick={handleReplayFlow}
          >
            UI 흐름 다시보기
          </button>
        </section>
      </main>
    </div>
  );
}
