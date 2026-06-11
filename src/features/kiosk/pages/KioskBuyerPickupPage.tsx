import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import logoImage from "../../../assets/images/Loocker.png";
import cameraModuleImage from "../../../assets/images/kiosk/kiosk_camera_module.png";
import {
  kioskApi,
  type KioskLockerCommandStatusSelectResponse,
  type KioskLockerNextStatus,
  type KioskLockerRequestTypeCode,
  type KioskLockerRoleType,
} from "../api/kioskApi";
import styles from "../styles/kioskBuyerCheck.module.css";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";
import {
  getBuyerCheckAuthCode,
  getBuyerCheckKioskCode,
  saveBuyerCheckAuthSession,
  saveBuyerCheckImages,
  saveBuyerCheckLocker,
  saveBuyerCheckProduct,
} from "../utils/buyerCheckSession";

type BuyerCheckProduct = {
  PRODUCT_ID: number;
  TRADE_ID: number;
  TITLE: string;
  BASE_PRICE: number;
  PRODUCT_STATUS_CODE: string;
  IMAGE_URL?: string | null;
  LOCKER_ID?: number;
  LOCKER_NO?: number;
};

type BuyerLockerResult = {
  TRADE_ID: number;
  PRODUCT_ID: number;
  LOCKER_ID: number;
  LOCKER_NO: number;
};

type PickupLocationState = {
  authCode?: string;
  kioskCode?: string;
  product?: BuyerCheckProduct;
  locker?: BuyerLockerResult;
  sellerStoredImageUrl?: string;
  currentCaptureImageUrl?: string;
};

type PickupStep = "OPENING" | "OPENED" | "CLOSING" | "DONE" | "ERROR";

type CommandCheckResult = {
  isSuccess: boolean;
  isFailed: boolean;
  canRetry: boolean;
  failedCommand?: string;
  resultMessage?: string;
  rawStatus: string;
};

const STATUS_BUYER_UNLOCK_REQUESTED =
  "BUYER_UNLOCK_REQUESTED" as KioskLockerNextStatus;

const STATUS_BUYER_UNLOCK_READY = "BUYER_UNLOCK_READY" as KioskLockerNextStatus;

const STATUS_BUYER_PICKUP_DONE = "BUYER_PICKUP_DONE" as KioskLockerNextStatus;

const STATUS_PICKUP_LOCKED_EMPTY_READY =
  "PICKUP_LOCKED_EMPTY_READY" as KioskLockerNextStatus;

const STATUS_EMPTY = "EMPTY" as KioskLockerNextStatus;

const COMMAND_POLL_DELAY_MS = 1000;
const COMMAND_POLL_INTERVAL_MS = 1000;
const COMMAND_POLL_TIMEOUT_MS = 60 * 1000;

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatPrice(price?: number) {
  if (typeof price !== "number") return "-";
  return `${price.toLocaleString()}원`;
}

function isKioskCodeLike(value?: string | null) {
  if (!value) return false;

  const normalized = value.trim().toUpperCase();

  return normalized.startsWith("UWC-") || normalized === "LOCKER_001";
}

function pickAuthCode(
  values: Array<string | null | undefined>,
  kioskCode: string,
) {
  const normalizedKioskCode = kioskCode.trim();

  for (const value of values) {
    const trimmed = value?.trim();

    if (!trimmed) continue;
    if (trimmed === normalizedKioskCode) continue;
    if (isKioskCodeLike(trimmed)) continue;

    return trimmed;
  }

  return "";
}

function getSessionNumber(keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = Number(sessionStorage.getItem(key) || "");

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return fallback;
}

function getSessionText(keys: string[], fallback = "") {
  for (const key of keys) {
    const value = sessionStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return fallback;
}

function getProductFromSession(): BuyerCheckProduct {
  const tradeId = getSessionNumber(
    ["buyerInspectionTradeId", "buyerCheckTradeId"],
    0,
  );

  const productId = getSessionNumber(
    ["buyerInspectionProductId", "buyerCheckProductId"],
    0,
  );

  const lockerId = getSessionNumber(
    ["buyerInspectionLockerId", "buyerCheckLockerId"],
    0,
  );

  const lockerNo = getSessionNumber(
    ["buyerInspectionLockerNo", "buyerCheckLockerNo"],
    lockerId,
  );

  return {
    TRADE_ID: tradeId,
    PRODUCT_ID: productId,
    TITLE: getSessionText(
      ["buyerInspectionProductTitle", "buyerCheckProductTitle"],
      "상품명 없음",
    ),
    BASE_PRICE: getSessionNumber(
      ["buyerInspectionProductPrice", "buyerCheckProductPrice"],
      0,
    ),
    PRODUCT_STATUS_CODE: getSessionText(
      ["buyerInspectionProductStatusCode", "buyerCheckProductStatusCode"],
      "",
    ),
    IMAGE_URL: getSessionText(
      ["buyerInspectionProductImageUrl", "buyerCheckProductImageUrl"],
      "",
    ),
    LOCKER_ID: lockerId,
    LOCKER_NO: lockerNo,
  };
}

function getLockerFromSession(product: BuyerCheckProduct): BuyerLockerResult {
  const lockerId =
    getSessionNumber(["buyerInspectionLockerId", "buyerCheckLockerId"], 0) ||
    product.LOCKER_ID ||
    0;

  return {
    TRADE_ID:
      getSessionNumber(["buyerInspectionTradeId", "buyerCheckTradeId"], 0) ||
      product.TRADE_ID,
    PRODUCT_ID:
      getSessionNumber(
        ["buyerInspectionProductId", "buyerCheckProductId"],
        0,
      ) || product.PRODUCT_ID,
    LOCKER_ID: lockerId,
    LOCKER_NO:
      getSessionNumber(["buyerInspectionLockerNo", "buyerCheckLockerNo"], 0) ||
      product.LOCKER_NO ||
      lockerId,
  };
}

function getLockerDisplayNo(value?: number | string | null) {
  const rawValue = Number(value ?? 0);

  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return "-";
  }

  return ((rawValue - 1) % 4) + 1;
}

function normalizeCommandCheckResult(
  data: KioskLockerCommandStatusSelectResponse[],
): CommandCheckResult {
  const first = data.filter(Boolean)[0];

  if (!first) {
    return {
      isSuccess: false,
      isFailed: false,
      canRetry: false,
      rawStatus: "NONE",
      resultMessage: "아직 생성된 명령이 없습니다.",
    };
  }

  const rawStatus = String(
    first.CHECK_STATUS || first.checkStatus || "",
  ).toUpperCase();

  const canRetry = String(
    first.CAN_RETRY || first.canRetry || "",
  ).toUpperCase();

  const failedCommand =
    first.FAILED_COMMAND_TYPE_CODE || first.failedCommandTypeCode || "";

  const resultMessage =
    first.RESULT_MESSAGE || first.resultMessage || "명령 상태를 확인 중입니다.";

  return {
    isSuccess: rawStatus === "SUCCESS",
    isFailed: rawStatus === "FAILED",
    canRetry: canRetry === "Y",
    failedCommand: failedCommand || undefined,
    resultMessage,
    rawStatus: rawStatus || "NONE",
  };
}

function extractCleanErrorMessage(message?: string) {
  if (!message) return "요청 처리 중 오류가 발생했습니다.";

  const knownMessages = [
    "키오스크 인증 정보가 만료되었습니다.",
    "키오스크 사용자 인증 정보가 없습니다.",
    "진행 가능한 거래 또는 보관함이 없습니다.",
    "배정된 보관함이 없습니다.",
    "보관함 정보를 찾을 수 없습니다.",
    "현재 보관함 상태값이 정의되어 있지 않습니다.",
    "존재하지 않는 보관함 상태값입니다.",
    "허용되지 않은 보관함 상태 전이입니다.",
    "라즈베리파이 명령 실패",
    "라즈베리파이 명령이 아직 성공하지 않았습니다",
    "보관함 상태 변경에 실패했습니다.",
    "이미 처리 대기 중이거나 실행 중인 동일 명령이 있습니다.",
    "재시도 가능한 실패 명령이 없습니다.",
  ];

  const matched = knownMessages.find((text) => message.includes(text));

  if (matched) return matched;

  const sqlServerExceptionMatch = message.match(
    /SQLServerException:\s*([^;\r\n]+)/,
  );

  if (sqlServerExceptionMatch?.[1]) {
    return sqlServerExceptionMatch[1].trim();
  }

  const causeMatch = message.match(/Cause:\s*([^;\r\n]+)/);

  if (causeMatch?.[1]) {
    return causeMatch[1].trim();
  }

  return message.split("\n")[0]?.trim() || "요청 처리 중 오류가 발생했습니다.";
}

export default function KioskBuyerPickupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authCode } = useParams<{ authCode?: string }>();

  const state = (location.state || {}) as PickupLocationState;

  const fallbackProduct = useMemo(() => getProductFromSession(), []);

  const product = useMemo<BuyerCheckProduct>(() => {
    return {
      ...fallbackProduct,
      ...(state.product || {}),
    };
  }, [fallbackProduct, state.product]);

  const fallbackLocker = useMemo(
    () => getLockerFromSession(product),
    [product],
  );

  const locker = useMemo<BuyerLockerResult>(() => {
    return {
      ...fallbackLocker,
      ...(state.locker || {}),
    };
  }, [fallbackLocker, state.locker]);

  const normalizedKioskCode =
    state.kioskCode ||
    localStorage.getItem("kioskCode") ||
    localStorage.getItem("KIOSK_CODE") ||
    getBuyerCheckKioskCode() ||
    sessionStorage.getItem("kioskCode") ||
    "";

  const normalizedAuthCode = pickAuthCode(
    [
      authCode,
      state.authCode,
      getBuyerCheckAuthCode(),
      sessionStorage.getItem("buyerInspectionAuthCode"),
      sessionStorage.getItem("buyerCheckAuthCode"),
    ],
    normalizedKioskCode,
  );

  const tradeId = Number(locker.TRADE_ID || product.TRADE_ID);
  const productId = Number(locker.PRODUCT_ID || product.PRODUCT_ID);
  const lockerId = Number(locker.LOCKER_ID || product.LOCKER_ID);
  const lockerNo = Number(locker.LOCKER_NO || product.LOCKER_NO || lockerId);

  const productImageUrl = product.IMAGE_URL
    ? toApiAssetUrl(product.IMAGE_URL)
    : "";

  const [step, setStep] = useState<PickupStep>("OPENING");
  const [message, setMessage] = useState("보관함 문을 여는 중입니다.");
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [sellerImageUrl] = useState(state.sellerStoredImageUrl || "");
  const [buyerImageUrl] = useState(state.currentCaptureImageUrl || "");

  const startedRef = useRef(false);
  const cancelledRef = useRef(false);

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

    if (!tradeId) {
      throw new Error("TRADE_ID가 없습니다. 거래 정보를 다시 확인해주세요.");
    }

    if (!lockerId) {
      throw new Error("LOCKER_ID가 없습니다. 보관함 정보를 다시 확인해주세요.");
    }
  }

  function savePickupSession() {
    saveBuyerCheckAuthSession({
      AUTH_CODE: normalizedAuthCode,
      KIOSK_CODE: normalizedKioskCode,
    });

    saveBuyerCheckProduct({
      PRODUCT_ID: productId,
      TRADE_ID: tradeId,
      TITLE: product.TITLE,
      BASE_PRICE: product.BASE_PRICE,
      PRODUCT_STATUS_CODE: product.PRODUCT_STATUS_CODE || "",
      IMAGE_URL: productImageUrl,
    });

    saveBuyerCheckLocker({
      TRADE_ID: tradeId,
      PRODUCT_ID: productId,
      LOCKER_ID: lockerId,
      LOCKER_NO: lockerNo,
    });

    saveBuyerCheckImages({
      sellerStoredImageUrl: sellerImageUrl,
      currentCaptureImageUrl: buyerImageUrl,
    });

    sessionStorage.setItem("buyerInspectionAuthCode", normalizedAuthCode);
    sessionStorage.setItem("buyerInspectionTradeId", String(tradeId));
    sessionStorage.setItem("buyerInspectionProductId", String(productId));
    sessionStorage.setItem("buyerInspectionProductTitle", product.TITLE);
    sessionStorage.setItem(
      "buyerInspectionProductPrice",
      String(product.BASE_PRICE || 0),
    );
    sessionStorage.setItem(
      "buyerInspectionProductStatusCode",
      product.PRODUCT_STATUS_CODE || "",
    );
    sessionStorage.setItem("buyerInspectionProductImageUrl", productImageUrl);
    sessionStorage.setItem("buyerInspectionLockerId", String(lockerId));
    sessionStorage.setItem("buyerInspectionLockerNo", String(lockerNo));
  }

  async function createLockerCommand(
    nextStatus: KioskLockerNextStatus,
    requestTypeCode: KioskLockerRequestTypeCode = "NORMAL",
  ) {
    await kioskApi.createLockerCommand({
      AUTH_CODE: normalizedAuthCode,
      KIOSK_CODE: normalizedKioskCode,
      NEXT_STATUS: nextStatus,
      REQUEST_TYPE_CODE: requestTypeCode,
    });
  }

  async function updateLockerState(
    nextStatus: KioskLockerNextStatus,
    roleType: KioskLockerRoleType,
  ) {
    await kioskApi.updateLockerState({
      TRADE_ID: tradeId,
      AUTH_CODE: normalizedAuthCode,
      NEXT_STATUS: nextStatus,
      ROLE_TYPE: roleType,
      RESULT_STATUS_CODE: "",
    });
  }

  async function checkCommandStatus(statusName: KioskLockerNextStatus) {
    const data = await kioskApi.selectLockerCommandStatus({
      AUTH_CODE: normalizedAuthCode,
      KIOSK_CODE: normalizedKioskCode,
      LOCKER_ID: lockerId,
      LOCKER_STATUS_NAME: statusName,
    });

    return normalizeCommandCheckResult(data);
  }

  async function waitUntilCommandSuccess(statusName: KioskLockerNextStatus) {
    const startedAt = Date.now();

    while (!cancelledRef.current) {
      const result = await checkCommandStatus(statusName);

      if (result.isSuccess) {
        return;
      }

      if (result.isFailed) {
        throw new Error(
          `라즈베리파이 명령 실패: ${
            result.failedCommand || statusName
          } / ${result.resultMessage || "상세 사유 없음"}`,
        );
      }

      if (Date.now() - startedAt > COMMAND_POLL_TIMEOUT_MS) {
        throw new Error(
          `라즈베리파이 명령 대기 시간이 초과되었습니다: ${statusName}`,
        );
      }

      setMessage(`라즈베리파이 명령 성공 대기 중입니다. (${result.rawStatus})`);

      await sleep(COMMAND_POLL_INTERVAL_MS);
    }

    throw new Error("작업이 취소되었습니다.");
  }

  async function openLockerForPickup() {
    try {
      validateRequiredData();

      setIsProcessing(true);
      setStep("OPENING");
      setMessage("보관함 문을 열고 있습니다.");

      savePickupSession();

      await createLockerCommand(STATUS_BUYER_UNLOCK_REQUESTED, "NORMAL");

      await updateLockerState(STATUS_BUYER_UNLOCK_REQUESTED, "KIOSK");

      await sleep(COMMAND_POLL_DELAY_MS);

      await waitUntilCommandSuccess(STATUS_BUYER_UNLOCK_REQUESTED);

      await sleep(500);

      await updateLockerState(STATUS_BUYER_UNLOCK_READY, "DEVICE");

      if (cancelledRef.current) return;

      setStep("OPENED");
      setMessage("보관함 문이 열렸습니다. 물품을 꺼낸 뒤 문을 닫아주세요.");
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "보관함 문 열림 처리 중 알 수 없는 오류가 발생했습니다.";

      setStep("ERROR");
      setErrorMessage(extractCleanErrorMessage(nextMessage));
      setMessage("");
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

      await sleep(COMMAND_POLL_DELAY_MS);

      await waitUntilCommandSuccess(STATUS_BUYER_PICKUP_DONE);

      await sleep(500);

      await updateLockerState(STATUS_PICKUP_LOCKED_EMPTY_READY, "DEVICE");

      await sleep(300);

      await updateLockerState(STATUS_EMPTY, "KIOSK");

      setStep("DONE");
      setMessage(
        "수령이 완료되었습니다. 보관함이 비어 있음 상태로 변경되었습니다.",
      );
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "수령 완료 처리 중 알 수 없는 오류가 발생했습니다.";

      setStep("ERROR");
      setErrorMessage(extractCleanErrorMessage(nextMessage));
      setMessage("");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleFinish() {
    navigate("/kiosk", { replace: true });
  }

  function handleRetry() {
    if (step === "ERROR") {
      openLockerForPickup();
    }
  }

  useEffect(() => {
    cancelledRef.current = false;

    if (startedRef.current) return;

    startedRef.current = true;
    openLockerForPickup();

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <img src={logoImage} alt="Loocker" className={styles.logo} />

        <button
          type="button"
          className={styles.homeButton}
          onClick={handleFinish}
          disabled={isProcessing}
        >
          처음으로
        </button>
      </header>

      <section className={styles.productCard}>
        <h1 className={styles.title}>구매자 물품 수령</h1>

        <p className={styles.description}>
          보관함에서 물품을 꺼낸 뒤 문을 닫고 수령 완료를 진행해주세요.
        </p>

        <div className={styles.productList}>
          <div
            className={`${styles.productItem} ${styles.productItemSelected}`}
          >
            <div className={styles.productImageBox}>
              {productImageUrl ? (
                <img
                  src={productImageUrl}
                  alt={product.TITLE}
                  className={styles.productImage}
                />
              ) : (
                <div className={styles.noImage}>NO IMAGE</div>
              )}
            </div>

            <div className={styles.productInfo}>
              <strong>{product.TITLE}</strong>
              <span>{formatPrice(product.BASE_PRICE)}</span>
              <p>{getLockerDisplayNo(lockerNo)}번 보관함</p>
            </div>
          </div>
        </div>

        {step === "OPENING" && (
          <div className={styles.emptyBox}>
            <img
              src={cameraModuleImage}
              alt="카메라 모듈"
              style={{ width: 96, height: 96, objectFit: "contain" }}
            />
            <p>{message}</p>
            <span>라즈베리파이 명령 성공 여부를 확인하고 있습니다.</span>
          </div>
        )}

        {step === "OPENED" && (
          <div className={styles.emptyBox}>
            <p>보관함 문이 열렸습니다.</p>
            <span>물품을 꺼낸 뒤 문을 닫고 수령 완료 버튼을 눌러주세요.</span>

            <button
              className={styles.primaryButton}
              type="button"
              onClick={completePickup}
              disabled={isProcessing}
            >
              {isProcessing ? "처리 중..." : "수령 완료"}
            </button>
          </div>
        )}

        {step === "CLOSING" && (
          <div className={styles.emptyBox}>
            <img
              src={cameraModuleImage}
              alt="문 닫힘 확인"
              style={{ width: 96, height: 96, objectFit: "contain" }}
            />
            <p>{message}</p>
            <span>문 닫힘 확인 후 보관함을 빈 상태로 변경합니다.</span>
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
          <div className={styles.emptyBox}>
            <div className={styles.doneCircle}>!</div>
            <p>{errorMessage || "수령 처리 중 오류가 발생했습니다."}</p>
            <span>명령 상태와 인증 정보를 확인한 뒤 다시 시도해주세요.</span>

            <button
              className={styles.primaryButton}
              type="button"
              onClick={handleRetry}
              disabled={isProcessing}
            >
              다시 시도
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
