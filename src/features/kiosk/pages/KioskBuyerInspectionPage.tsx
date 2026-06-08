import { useEffect, useMemo, useRef, useState } from "react";
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

type InspectionPhase = "PREPARING" | "COMPARE" | "DONE" | "ERROR";

type CommandStatusResponse = {
  CHECK_STATUS?: "WAITING" | "RUNNING" | "SUCCESS" | "FAILED";
  CAN_RETRY?: boolean | string;
  FAILED_COMMAND_TYPE_CODE?: string;
  RESULT_MESSAGE?: string;
  LOCKER_STATUS?: string;
};

type LockerImageResponse = {
  TRADE_ID?: number;
  LOCKER_ID?: number;
  SELLER_IMAGE_URL?: string;
  BUYER_IMAGE_URL?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const LOCKER_CODE =
  localStorage.getItem("LOCKER_CODE") ||
  localStorage.getItem("lockerCode") ||
  "LOCKER_001";

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

export default function KioskBuyerInspectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authCode } = useParams();

  const state = (location.state || {}) as InspectionLocationState;

  const product = state.product || fallbackProduct;
  const locker = state.locker || fallbackLocker;

  const normalizedAuthCode =
    authCode ||
    state.authCode ||
    sessionStorage.getItem("buyerCheckAuthCode") ||
    "";

  const normalizedKioskCode =
    state.kioskCode ||
    localStorage.getItem("KIOSK_CODE") ||
    localStorage.getItem("kioskCode") ||
    sessionStorage.getItem("kioskCode") ||
    "";

  const tradeId = locker.TRADE_ID || product.TRADE_ID;
  const lockerId = locker.LOCKER_ID;

  const [phase, setPhase] = useState<InspectionPhase>("PREPARING");
  const [sellerStoredImageUrl, setSellerStoredImageUrl] = useState(
    state.sellerStoredImageUrl || product.IMAGE_URL || cameraModuleImage,
  );
  const [currentCaptureImageUrl, setCurrentCaptureImageUrl] = useState(
    state.currentCaptureImageUrl || cameraModuleImage,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const startedRef = useRef(false);

  const phaseText = useMemo(() => {
    if (phase === "PREPARING") {
      return {
        title: "보관함 내부 확인을 준비 중입니다.",
        description: "조명과 필름을 켜고 현재 보관 상태를 촬영합니다.",
        subDescription:
          "라즈베리파이 명령이 완료되면 판매자 보관 사진과 현재 촬영 사진을 비교합니다.",
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

    if (phase === "ERROR") {
      return {
        title: "물품 확인 준비 중 오류가 발생했습니다.",
        description:
          errorMessage || "라즈베리파이 명령 상태를 확인하지 못했습니다.",
        subDescription: "잠시 후 다시 시도해주세요.",
      };
    }

    return {
      title: "물품 확인이 완료되었습니다.",
      description: "구매자 물품 확인 단계가 완료되었습니다.",
      subDescription: "이후 물품 수령 단계로 이어서 진행할 수 있습니다.",
    };
  }, [phase, errorMessage]);

  async function createBuyerInspectionCommand(
    requestTypeCode: "NORMAL" | "RETRY",
  ) {
    await requestJson("/kiosk/locker/command/create", {
      method: "PUT",
      body: JSON.stringify({
        AUTH_CODE: normalizedAuthCode,
        KIOSK_CODE: normalizedKioskCode,
        NEXT_STATUS: "BUYER_INSPECTION_READY",
        REQUEST_TYPE_CODE: requestTypeCode,
      }),
    });
  }

  async function selectBuyerInspectionStatus() {
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
        LOCKER_STATUS_NAME: "BUYER_INSPECTION_READY",
      },
    );

    return unwrapResponse<CommandStatusResponse>(response);
  }

  async function updateLockerToBuyerInspectionReady() {
    await requestJson("/kiosk/locker/update", {
      method: "PUT",
      body: JSON.stringify({
        TRADE_ID: tradeId,
        AUTH_CODE: normalizedAuthCode,
        NEXT_STATUS: "BUYER_INSPECTION_READY",
        ROLE_TYPE: "DEVICE",
        RESULT_STATUS_CODE: "",
      }),
    });
  }

  async function updateLockerToBuyerItemConfirmed() {
    await requestJson("/kiosk/locker/update", {
      method: "PUT",
      body: JSON.stringify({
        TRADE_ID: tradeId,
        AUTH_CODE: normalizedAuthCode,
        NEXT_STATUS: "BUYER_ITEM_CONFIRMED",
        ROLE_TYPE: "KIOSK",
        RESULT_STATUS_CODE: "",
      }),
    });
  }

  async function selectLockerImages() {
    const response = await requestJson<LockerImageResponse>(
      "/kiosk/locker/img/select",
      {
        method: "GET",
      },
      {
        LOCKER_CODE,
        KIOSK_CODE: normalizedKioskCode,
        TRADE_ID: tradeId,
        LOCKER_ID: lockerId,
      },
    );

    return unwrapResponse<LockerImageResponse>(response);
  }

  async function waitUntilBuyerInspectionSuccess() {
    const maxTryCount = 30;

    for (let i = 0; i < maxTryCount; i += 1) {
      const status = await selectBuyerInspectionStatus();

      if (status.CHECK_STATUS === "SUCCESS") {
        return status;
      }

      if (status.CHECK_STATUS === "FAILED") {
        throw new Error(
          status.RESULT_MESSAGE ||
            `${status.FAILED_COMMAND_TYPE_CODE || "BUYER_INSPECTION_READY"} 명령이 실패했습니다.`,
        );
      }

      await sleep(1000);
    }

    throw new Error("라즈베리파이 명령 성공 확인 시간이 초과되었습니다.");
  }

  async function prepareBuyerInspection(
    requestTypeCode: "NORMAL" | "RETRY" = "NORMAL",
  ) {
    if (!normalizedAuthCode) {
      setErrorMessage("AUTH_CODE가 없습니다. QR 인증부터 다시 진행해주세요.");
      setPhase("ERROR");
      return;
    }

    if (!normalizedKioskCode) {
      setErrorMessage(
        "KIOSK_CODE가 없습니다. 키오스크 로그인을 다시 진행해주세요.",
      );
      setPhase("ERROR");
      return;
    }

    if (!tradeId || !lockerId) {
      setErrorMessage(
        "TRADE_ID 또는 LOCKER_ID가 없습니다. 거래 정보를 다시 확인해주세요.",
      );
      setPhase("ERROR");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setPhase("PREPARING");

      await createBuyerInspectionCommand(requestTypeCode);

      await sleep(1000);

      await waitUntilBuyerInspectionSuccess();

      await updateLockerToBuyerInspectionReady();

      const images = await selectLockerImages();

      setSellerStoredImageUrl(
        images.SELLER_IMAGE_URL ||
          state.sellerStoredImageUrl ||
          product.IMAGE_URL ||
          cameraModuleImage,
      );

      setCurrentCaptureImageUrl(
        images.BUYER_IMAGE_URL ||
          state.currentCaptureImageUrl ||
          cameraModuleImage,
      );

      setPhase("COMPARE");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "구매자 물품 확인 준비 중 알 수 없는 오류가 발생했습니다.";

      setErrorMessage(message);
      setPhase("ERROR");
    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    if (startedRef.current) return;

    startedRef.current = true;
    prepareBuyerInspection("NORMAL");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGoHome() {
    navigate("/kiosk");
  }

  function handleRetryCapture() {
    prepareBuyerInspection("RETRY");
  }

  async function handleConfirmItem() {
    try {
      setIsProcessing(true);
      setErrorMessage("");

      await updateLockerToBuyerItemConfirmed();

      setPhase("DONE");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "물품 확인 완료 처리 중 알 수 없는 오류가 발생했습니다.";

      setErrorMessage(message);
      setPhase("ERROR");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleMovePickup() {
    navigate("/kiosk/pickup", {
      state: {
        authCode: normalizedAuthCode,
        kioskCode: normalizedKioskCode,
        product,
        locker,
        sellerStoredImageUrl,
        currentCaptureImageUrl,
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

              <button type="button" className={styles.secondaryButton} disabled>
                {isProcessing ? "보관함 내부 확인 중..." : "확인 준비 중"}
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
                  disabled={isProcessing}
                >
                  다시 확인하기
                </button>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleConfirmItem}
                  disabled={isProcessing}
                >
                  {isProcessing ? "처리 중..." : "물품이 맞습니다"}
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

          {phase === "ERROR" && (
            <>
              <div className={styles.doneCircle}>!</div>

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
                  onClick={() => prepareBuyerInspection("RETRY")}
                  disabled={isProcessing}
                >
                  {isProcessing ? "재시도 중..." : "다시 시도"}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
