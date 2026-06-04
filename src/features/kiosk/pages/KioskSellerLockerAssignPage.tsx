import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import logoImage from "../../../assets/images/Loocker.png";
import {
  kioskApi,
  type KioskLockerCommandStatusSelectResponse,
  type KioskLockerNextStatus,
  type KioskLockerRequestTypeCode,
  type KioskLockerRoleType,
} from "../api/kioskApi";
import styles from "../styles/kiosk.module.css";

type DepositStep =
  | "OPENING"
  | "OPENED"
  | "CLOSING"
  | "CAPTURING"
  | "PHOTO"
  | "DONE"
  | "ERROR";

type LockerAssignState = {
  TRADE_ID?: number;
  PRODUCT_ID?: number;
  TITLE?: string;
  PRODUCT_TITLE?: string;
  IMAGE_URL?: string;
  PRODUCT_IMAGE_URL?: string;
  THUMBNAIL_URL?: string;
  PRODUCT_IMG?: string;
  BASE_PRICE?: number;
  PRICE?: number;
  SELL_PRICE?: number;
  LOCKER_ID?: number;
  LOCKER_NO?: number;
  LOCKER_STATUS_CODE?: string;
  LOCKER_STATUS?: string;
};

type CommandCheckResult = {
  isSuccess: boolean;
  isFailed: boolean;
  failedCommand?: string;
  resultMessage?: string;
  rawStatus?: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const COMMAND_POLL_DELAY_AFTER_CREATE_MS = 1000;
const COMMAND_POLL_INTERVAL_MS = 1000;
const COMMAND_POLL_TIMEOUT_MS = 60 * 1000;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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

function formatPrice(value?: number) {
  if (typeof value !== "number") return "가격 정보 없음";
  return `${value.toLocaleString()}원`;
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
    "판매자만 처리할 수 있는 보관함 이벤트입니다.",
    "라즈베리파이 명령 실패",
    "라즈베리파이 명령이 아직 성공하지 않았습니다",
    "보관함 상태 변경에 실패했습니다.",
    "이미 처리 대기 중이거나 실행 중인 동일 명령이 있습니다.",
    "재시도 가능한 실패 명령이 없습니다.",
  ];

  const matched = knownMessages.find((text) => message.includes(text));

  if (matched) {
    return matched;
  }

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

  const firstLine = message.split("\n")[0]?.trim();

  return firstLine || "요청 처리 중 오류가 발생했습니다.";
}

function getProductTitle(data?: LockerAssignState | null) {
  if (!data) return "-";
  return data.PRODUCT_TITLE || data.TITLE || "-";
}

function getProductPrice(data?: LockerAssignState | null) {
  if (!data) return undefined;

  if (typeof data.BASE_PRICE === "number") return data.BASE_PRICE;
  if (typeof data.PRICE === "number") return data.PRICE;
  if (typeof data.SELL_PRICE === "number") return data.SELL_PRICE;

  const savedPrice = Number(
    sessionStorage.getItem("sellerDepositProductPrice"),
  );

  return Number.isFinite(savedPrice) && savedPrice > 0 ? savedPrice : undefined;
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

function getProgressClass(step: DepositStep) {
  switch (step) {
    case "OPENING":
      return styles.kioskDepositProgressFill25;
    case "OPENED":
      return styles.kioskDepositProgressFill50;
    case "CLOSING":
      return styles.kioskDepositProgressFill75;
    case "CAPTURING":
    case "PHOTO":
    case "DONE":
      return styles.kioskDepositProgressFill100;
    default:
      return styles.kioskDepositProgressFill0;
  }
}

function getCurrentStepText(step: DepositStep) {
  switch (step) {
    case "OPENING":
      return "보관함 문을 여는 중입니다.";
    case "OPENED":
      return "보관함 문이 열렸습니다.";
    case "CLOSING":
      return "문 닫힘을 확인하고 있습니다.";
    case "CAPTURING":
      return "보관 사진을 촬영하고 있습니다.";
    case "PHOTO":
      return "보관 사진을 확인해주세요.";
    case "DONE":
      return "물품 보관이 완료되었습니다.";
    case "ERROR":
      return "오류가 발생했습니다.";
    default:
      return "";
  }
}

function normalizeCommandCheckResult(
  data: KioskLockerCommandStatusSelectResponse[],
): CommandCheckResult {
  const normalizedList = data.filter(Boolean).map((item) => {
    const rawStatus = String(
      item.COMMAND_STATUS_CODE ||
        item.commandStatusCode ||
        item.STATUS_CODE ||
        item.statusCode ||
        item.RESULT_STATUS_CODE ||
        item.resultStatusCode ||
        "",
    ).toUpperCase();

    return {
      rawStatus,
      failedCommand:
        item.FAILED_COMMAND ||
        item.failedCommand ||
        item.COMMAND_TYPE_CODE ||
        item.commandTypeCode ||
        "",
      resultMessage:
        item.RESULT_MESSAGE ||
        item.resultMessage ||
        item.MESSAGE ||
        item.message ||
        "",
      isSuccess:
        item.IS_SUCCESS === true ||
        item.IS_SUCCESS === 1 ||
        item.isSuccess === true ||
        item.isSuccess === 1 ||
        rawStatus === "SUCCESS" ||
        rawStatus === "ALL_SUCCESS" ||
        rawStatus === "COMMAND_SUCCESS" ||
        rawStatus === "COMPLETED",
      isFailed:
        item.IS_FAILED === true ||
        item.IS_FAILED === 1 ||
        item.isFailed === true ||
        item.isFailed === 1 ||
        rawStatus === "FAILED" ||
        rawStatus === "COMMAND_FAILED" ||
        Boolean(item.FAILED_COMMAND || item.failedCommand),
    };
  });

  if (normalizedList.length === 0) {
    return {
      isSuccess: false,
      isFailed: false,
      rawStatus: "",
    };
  }

  const failed = normalizedList.find((item) => item.isFailed);

  if (failed) {
    return {
      isSuccess: false,
      isFailed: true,
      failedCommand: failed.failedCommand,
      resultMessage: failed.resultMessage,
      rawStatus: failed.rawStatus,
    };
  }

  const allSuccess = normalizedList.every((item) => item.isSuccess);

  return {
    isSuccess: allSuccess,
    isFailed: false,
    rawStatus: normalizedList.map((item) => item.rawStatus).join(","),
  };
}

export default function KioskSellerDepositLockerAssignPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authCode } = useParams<{ authCode?: string }>();

  const assignData = (location.state || {}) as LockerAssignState;

  const [step, setStep] = useState<DepositStep>("OPENING");
  const [apiMessage, setApiMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [capturedImageUrl, setCapturedImageUrl] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const startedRef = useRef(false);
  const cancelledRef = useRef(false);
  const lastFailedActionRef = useRef<"OPEN" | "CLOSE_PHOTO" | "PHOTO_CONFIRM">(
    "OPEN",
  );

  const normalizedAuthCode =
    authCode || sessionStorage.getItem("sellerDepositAuthCode") || "";

  const kioskCode = localStorage.getItem("kioskCode") || "";

  const tradeId =
    assignData.TRADE_ID ||
    Number(sessionStorage.getItem("sellerDepositTradeId") || 0);

  const lockerId =
    assignData.LOCKER_ID ||
    Number(sessionStorage.getItem("sellerDepositLockerId") || 0);

  const productTitle = getProductTitle(assignData);
  const productPrice = getProductPrice(assignData);
  const productImageUrl = toApiAssetUrl(getProductImageUrl(assignData));
  const lockerNo =
    assignData.LOCKER_NO || assignData.LOCKER_ID || lockerId || "-";

  const previewImageUrl = capturedImageUrl || productImageUrl;

  const progressClassName = useMemo(() => getProgressClass(step), [step]);

  function validateRequiredValues() {
    if (!normalizedAuthCode) {
      throw new Error("판매자 인증 코드가 없습니다.");
    }

    if (!kioskCode) {
      throw new Error("키오스크 코드가 없습니다.");
    }

    if (!tradeId) {
      throw new Error("거래 ID가 없습니다.");
    }

    if (!lockerId) {
      throw new Error("보관함 ID가 없습니다.");
    }
  }

  async function createLockerCommand(
    nextStatus: KioskLockerNextStatus,
    requestTypeCode: KioskLockerRequestTypeCode = "NORMAL",
  ) {
    setApiMessage(
      `라즈베리파이 명령 생성 중: ${nextStatus} / ${requestTypeCode}`,
    );

    await kioskApi.createLockerCommand({
      AUTH_CODE: normalizedAuthCode,
      KIOSK_CODE: kioskCode,
      NEXT_STATUS: nextStatus,
      REQUEST_TYPE_CODE: requestTypeCode,
    });
  }

  async function createLockerCommandAndDelay(
    nextStatus: KioskLockerNextStatus,
    requestTypeCode: KioskLockerRequestTypeCode = "NORMAL",
  ) {
    await createLockerCommand(nextStatus, requestTypeCode);

    setApiMessage(
      `명령 생성 완료. ${COMMAND_POLL_DELAY_AFTER_CREATE_MS / 1000}초 후 상태를 확인합니다.`,
    );

    await sleep(COMMAND_POLL_DELAY_AFTER_CREATE_MS);
  }

  async function updateLockerState(
    nextStatus: KioskLockerNextStatus,
    roleType: KioskLockerRoleType,
  ) {
    setApiMessage(`보관함 상태 변경 중: ${nextStatus}`);

    await kioskApi.updateLockerState({
      TRADE_ID: tradeId,
      AUTH_CODE: normalizedAuthCode,
      NEXT_STATUS: nextStatus,
      ROLE_TYPE: roleType,
    });
  }

  async function checkCommandSuccess(lockerStatusName: KioskLockerNextStatus) {
    const data = await kioskApi.selectLockerCommandStatus({
      AUTH_CODE: normalizedAuthCode,
      KIOSK_CODE: kioskCode,
      LOCKER_ID: lockerId,
      LOCKER_STATUS_NAME: lockerStatusName,
    });

    return normalizeCommandCheckResult(data);
  }

  async function waitCommandSuccess(lockerStatusName: KioskLockerNextStatus) {
    const startedAt = Date.now();

    while (!cancelledRef.current) {
      const result = await checkCommandSuccess(lockerStatusName);

      if (result.isSuccess) {
        return;
      }

      if (result.isFailed) {
        throw new Error(
          `라즈베리파이 명령 실패: ${
            result.failedCommand || lockerStatusName
          } / ${result.resultMessage || "상세 사유 없음"}`,
        );
      }

      if (Date.now() - startedAt > COMMAND_POLL_TIMEOUT_MS) {
        throw new Error(
          `라즈베리파이 명령 대기 시간이 초과되었습니다: ${lockerStatusName}`,
        );
      }

      setApiMessage(
        `라즈베리파이 명령 성공 대기 중: ${lockerStatusName}${
          result.rawStatus ? ` (${result.rawStatus})` : ""
        }`,
      );

      await sleep(COMMAND_POLL_INTERVAL_MS);
    }
  }

  async function selectSellerCapturedImage() {
    try {
      const result = await kioskApi.selectLockerImage({
        TRADE_ID: tradeId,
        LOCKER_ID: lockerId || undefined,
        IMAGE_TYPE_CODE: "SELLER_INSERT",
      });

      const imageUrl =
        result?.IMAGE_URL ||
        result?.imageUrl ||
        result?.FILE_URL ||
        result?.fileUrl ||
        "";

      if (imageUrl) {
        setCapturedImageUrl(toApiAssetUrl(imageUrl));
      }
    } catch {
      setCapturedImageUrl("");
    }
  }

  async function runOpenFlow(
    requestTypeCode: KioskLockerRequestTypeCode = "NORMAL",
  ) {
    try {
      validateRequiredValues();

      setActionLoading(true);
      setErrorMessage("");
      setStep("OPENING");
      lastFailedActionRef.current = "OPEN";

      /**
       * 1. 문 열림 명령 생성
       * PUT /kiosk/locker/command/create
       *
       * {
       *   AUTH_CODE,
       *   KIOSK_CODE,
       *   NEXT_STATUS: "SELLER_UNLOCK_REQUESTED",
       *   REQUEST_TYPE_CODE: "NORMAL" | "RETRY"
       * }
       */
      await createLockerCommandAndDelay(
        "SELLER_UNLOCK_REQUESTED",
        requestTypeCode,
      );

      /**
       * 2. create 이후 1초 뒤부터 polling 시작
       * GET /kiosk/locker/command/status/select
       *
       * AUTH_CODE
       * KIOSK_CODE
       * LOCKER_ID
       * LOCKER_STATUS_NAME = SELLER_UNLOCK_READY
       */
      await waitCommandSuccess("SELLER_UNLOCK_READY");

      /**
       * 3. SUCCESS 확인 후 상태 전이
       * PUT /kiosk/locker/update
       *
       * {
       *   TRADE_ID,
       *   AUTH_CODE,
       *   RESULT_STATUS_CODE: "",
       *   NEXT_STATUS: "SELLER_UNLOCK_READY",
       *   ROLE_TYPE: "DEVICE"
       * }
       */
      await updateLockerState("SELLER_UNLOCK_READY", "DEVICE");

      if (cancelledRef.current) return;

      setStep("OPENED");
      setApiMessage("보관함 문이 열렸습니다.");
    } catch (error) {
      setStep("ERROR");
      setErrorMessage(
        extractCleanErrorMessage(
          error instanceof Error
            ? error.message
            : "보관함 문 열림 처리 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function runCloseAndCaptureFlow() {
    try {
      validateRequiredValues();

      setActionLoading(true);
      setErrorMessage("");
      setStep("CLOSING");
      lastFailedActionRef.current = "CLOSE_PHOTO";

      /**
       * 1. 판매자 물품 투입 완료 상태 전이
       */
      await updateLockerState("SELLER_DEPOSIT_CONFIRMED", "KIOSK");

      await sleep(2000);

      /**
       * 2. 문 닫힘 체크 명령 생성
       */
      await createLockerCommandAndDelay(
        "SELLER_DOOR_CLOSE_REQUESTED",
        "NORMAL",
      );

      /**
       * 3. 문 닫힘 요청 상태 전이
       */
      await updateLockerState("SELLER_DOOR_CLOSE_REQUESTED", "KIOSK");

      /**
       * 4. create 이후 1초 뒤부터 polling
       */
      await waitCommandSuccess("SELLER_DOOR_CLOSED");

      /**
       * 5. 문 닫힘 SUCCESS 후 상태 전이
       */
      await updateLockerState("SELLER_DOOR_CLOSED", "DEVICE");

      if (cancelledRef.current) return;

      setStep("CAPTURING");

      /**
       * 6. 사진 촬영 명령 생성
       */
      await createLockerCommandAndDelay("SELLER_LOCK_REQUESTED", "NORMAL");

      /**
       * 7. 사진 촬영 요청 상태 전이
       */
      await updateLockerState("SELLER_LOCK_REQUESTED", "KIOSK");

      /**
       * 8. create 이후 1초 뒤부터 polling
       */
      await waitCommandSuccess("SELLER_LOCKED_PHOTO_SAVED");

      /**
       * 9. 사진 저장 SUCCESS 후 상태 전이
       */
      await updateLockerState("SELLER_LOCKED_PHOTO_SAVED", "DEVICE");

      /**
       * 10. 저장된 사진 조회
       */
      await selectSellerCapturedImage();

      if (cancelledRef.current) return;

      setStep("PHOTO");
      setApiMessage("보관 사진이 촬영되었습니다.");
    } catch (error) {
      setStep("ERROR");
      setErrorMessage(
        extractCleanErrorMessage(
          error instanceof Error
            ? error.message
            : "문 닫힘 또는 사진 촬영 처리 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function runPhotoConfirmFlow() {
    try {
      validateRequiredValues();

      setActionLoading(true);
      setErrorMessage("");
      lastFailedActionRef.current = "PHOTO_CONFIRM";

      /**
       * 1. LED / PDLC OFF 명령 생성
       */
      await createLockerCommandAndDelay("SELLER_PHOTO_CONFIRMED", "NORMAL");

      /**
       * 2. create 이후 1초 뒤부터 polling
       */
      await waitCommandSuccess("SELLER_PHOTO_CONFIRMED");

      /**
       * 3. SUCCESS 확인 후 상태 전이
       */
      await updateLockerState("SELLER_PHOTO_CONFIRMED", "KIOSK");

      setStep("DONE");
      setApiMessage("물품 보관이 완료되었습니다.");
    } catch (error) {
      setStep("ERROR");
      setErrorMessage(
        extractCleanErrorMessage(
          error instanceof Error
            ? error.message
            : "사진 확인 완료 처리 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handleGoHome() {
    navigate("/kiosk", { replace: true });
  }

  function handleRetryOpen() {
    runOpenFlow("RETRY");
  }

  function handleDepositDone() {
    runCloseAndCaptureFlow();
  }

  function handlePhotoConfirm() {
    runPhotoConfirmFlow();
  }

  function handleRetryCurrentStep() {
    if (lastFailedActionRef.current === "OPEN") {
      runOpenFlow("RETRY");
      return;
    }

    if (lastFailedActionRef.current === "CLOSE_PHOTO") {
      runCloseAndCaptureFlow();
      return;
    }

    if (lastFailedActionRef.current === "PHOTO_CONFIRM") {
      runPhotoConfirmFlow();
    }
  }

  function handleFinish() {
    navigate("/kiosk", { replace: true });
  }

  useEffect(() => {
    cancelledRef.current = false;

    if (startedRef.current) return;

    startedRef.current = true;
    runOpenFlow("NORMAL");

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  return (
    <main className={styles.kioskDepositPage}>
      <header className={styles.kioskDepositHeader}>
        <img
          className={styles.kioskDepositLogo}
          src={logoImage}
          alt="Loocker"
        />

        <button
          className={styles.kioskDepositHomeButton}
          type="button"
          onClick={handleGoHome}
          disabled={actionLoading}
        >
          처음으로
        </button>
      </header>

      <section className={styles.kioskDepositMain}>
        <div className={styles.kioskDepositCard}>
          <h1 className={styles.kioskDepositTitle}>판매자 물품 보관</h1>

          <p className={styles.kioskDepositDescription}>
            안내에 따라 상품을 보관함에 넣어주세요.
          </p>

          <div className={styles.kioskDepositSummaryBox}>
            <div className={styles.kioskDepositSummaryTop}>
              <div className={styles.kioskDepositProductMini}>
                <div className={styles.kioskDepositProductImageBox}>
                  {productImageUrl ? (
                    <img
                      className={styles.kioskDepositProductImage}
                      src={productImageUrl}
                      alt={productTitle}
                    />
                  ) : (
                    <div className={styles.kioskDepositNoImage}>NO IMAGE</div>
                  )}
                </div>

                <div className={styles.kioskDepositProductInfo}>
                  <span>보관 상품</span>
                  <strong>{productTitle}</strong>
                  <p className={styles.kioskDepositProductPrice}>
                    {formatPrice(productPrice)}
                  </p>
                </div>
              </div>

              <div className={styles.kioskDepositLockerMini}>
                <span className={styles.kioskDepositLockerMiniLabel}>
                  보관함 번호
                </span>
                <strong className={styles.kioskDepositLockerNumber}>
                  {lockerNo}번
                </strong>
              </div>
            </div>

            <div className={styles.kioskDepositProgressTrack}>
              <div
                className={`${styles.kioskDepositProgressFill} ${progressClassName}`}
              />
            </div>

            <p className={styles.kioskDepositCurrentStep}>
              {getCurrentStepText(step)}
            </p>
          </div>

          {step === "OPENING" && (
            <div
              className={`${styles.kioskDepositPanel} ${styles.kioskDepositPanelBlue}`}
            >
              <div className={styles.kioskDepositDoorIcon}>
                <span />
              </div>

              <h2 className={styles.kioskDepositPanelTitle}>
                보관함 문을 여는 중입니다
              </h2>

              <p className={styles.kioskDepositPanelDescription}>
                잠시만 기다려주세요.
              </p>

              <p className={styles.kioskDepositPanelSubDescription}>
                {apiMessage || "라즈베리파이 문 열림 명령을 생성하고 있습니다."}
              </p>
            </div>
          )}

          {step === "OPENED" && (
            <div
              className={`${styles.kioskDepositPanel} ${styles.kioskDepositPanelGreen}`}
            >
              <div className={styles.kioskDepositOpenDoorIcon}>
                <span />
              </div>

              <h2 className={styles.kioskDepositPanelTitle}>
                보관함 문이 열렸습니다
              </h2>

              <p className={styles.kioskDepositPanelDescription}>
                물건을 보관함 안에 넣어주세요.
              </p>

              <p className={styles.kioskDepositPanelSubDescription}>
                문이 열리지 않았다면 재시도 버튼을 눌러주세요.
              </p>

              <button
                className={styles.kioskDepositRetryButton}
                type="button"
                onClick={handleRetryOpen}
                disabled={actionLoading}
              >
                문 열림 재시도
              </button>

              <button
                className={styles.kioskDepositPrimaryButton}
                type="button"
                onClick={handleDepositDone}
                disabled={actionLoading}
              >
                물품을 보관했습니다
              </button>
            </div>
          )}

          {step === "CLOSING" && (
            <div
              className={`${styles.kioskDepositPanel} ${styles.kioskDepositPanelOrange}`}
            >
              <div className={styles.kioskDepositClosedDoorIcon}>
                <span />
              </div>

              <h2 className={styles.kioskDepositPanelTitle}>
                문 닫힘 확인 중입니다
              </h2>

              <p className={styles.kioskDepositPanelDescription}>
                문이 완전히 닫힐 때까지 기다려주세요.
              </p>

              <p className={styles.kioskDepositPanelSubDescription}>
                {apiMessage || "문 닫힘 센서 값을 확인하고 있습니다."}
              </p>
            </div>
          )}

          {step === "CAPTURING" && (
            <div
              className={`${styles.kioskDepositPanel} ${styles.kioskDepositPanelPurple}`}
            >
              <div className={styles.kioskDepositCameraIcon}>
                <span />
              </div>

              <h2 className={styles.kioskDepositPanelTitle}>
                보관 사진을 촬영하고 있습니다
              </h2>

              <p className={styles.kioskDepositPanelDescription}>
                상품 보관 상태를 기록하는 중입니다.
              </p>

              <p className={styles.kioskDepositPanelSubDescription}>
                {apiMessage || "촬영 완료 후 사진 확인 화면으로 이동합니다."}
              </p>
            </div>
          )}

          {step === "PHOTO" && (
            <div
              className={`${styles.kioskDepositPanel} ${styles.kioskDepositPanelPurple}`}
            >
              <div className={styles.kioskDepositCaptureBox}>
                {previewImageUrl ? (
                  <img
                    className={styles.kioskDepositCaptureImage}
                    src={previewImageUrl}
                    alt="보관 사진 미리보기"
                  />
                ) : (
                  <div className={styles.kioskDepositCaptureEmpty} />
                )}
              </div>

              <h2 className={styles.kioskDepositPanelTitle}>
                촬영된 사진을 확인해주세요
              </h2>

              <p className={styles.kioskDepositPanelDescription}>
                보관 상태가 잘 보이는지 확인한 뒤 완료 버튼을 눌러주세요.
              </p>

              <button
                className={styles.kioskDepositPrimaryButton}
                type="button"
                onClick={handlePhotoConfirm}
                disabled={actionLoading}
              >
                사진 확인 완료
              </button>
            </div>
          )}

          {step === "DONE" && (
            <div
              className={`${styles.kioskDepositPanel} ${styles.kioskDepositPanelGreen}`}
            >
              <div className={styles.kioskDepositDoneCircle}>✓</div>

              <h2 className={styles.kioskDepositPanelTitle}>물품 보관 완료</h2>

              <p className={styles.kioskDepositPanelDescription}>
                구매자가 물품을 확인할 수 있는 상태가 되었습니다.
              </p>

              <p className={styles.kioskDepositPanelSubDescription}>
                거래 상태가 입고 완료로 변경되었습니다.
              </p>

              <button
                className={styles.kioskDepositPrimaryButton}
                type="button"
                onClick={handleFinish}
              >
                처음으로 돌아가기
              </button>
            </div>
          )}

          {step === "ERROR" && (
            <div
              className={`${styles.kioskDepositPanel} ${styles.kioskDepositPanelOrange}`}
            >
              <div className={styles.kioskDepositDoneCircle}>!</div>

              <h2 className={styles.kioskDepositPanelTitle}>
                처리 중 오류가 발생했습니다
              </h2>

              <p className={styles.kioskDepositPanelDescription}>
                {errorMessage}
              </p>

              <p className={styles.kioskDepositPanelSubDescription}>
                문제가 계속되면 처음 화면으로 돌아가 다시 진행해주세요.
              </p>

              <button
                className={styles.kioskDepositRetryButton}
                type="button"
                onClick={handleRetryCurrentStep}
                disabled={actionLoading}
              >
                현재 단계 재시도
              </button>

              <button
                className={styles.kioskDepositPrimaryButton}
                type="button"
                onClick={handleGoHome}
              >
                처음으로 돌아가기
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
