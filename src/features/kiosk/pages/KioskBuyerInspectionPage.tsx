import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import logoImage from "../../../assets/images/Loocker.png";
import cameraModuleImage from "../../../assets/images/kiosk/kiosk_camera_module.png";
import styles from "../styles/kioskBuyerCheck.module.css";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";

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

type InspectionLocationState = {
  authCode?: string;
  kioskCode?: string;
  product?: BuyerCheckProduct;
  locker?: BuyerLockerResult;
  sellerStoredImageUrl?: string;
  currentCaptureImageUrl?: string;
};

type InspectionPhase =
  | "LOADING_PRODUCTS"
  | "SELECT_PRODUCT"
  | "PREPARING"
  | "COMPARE"
  | "DONE"
  | "ERROR";

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

function normalizeImageUrl(url?: string | null) {
  if (!url) return "";
  return toApiAssetUrl(url);
}

function toNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  if (Number.isFinite(numberValue)) {
    return numberValue;
  }

  return fallback;
}

function toText(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function normalizeBuyerProduct(raw: unknown): BuyerCheckProduct {
  const item =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  const productId = toNumber(item.PRODUCT_ID ?? item.productId);
  const tradeId = toNumber(item.TRADE_ID ?? item.tradeId);
  const lockerId = toNumber(item.LOCKER_ID ?? item.lockerId);
  const lockerNo = toNumber(item.LOCKER_NO ?? item.lockerNo, lockerId);

  return {
    PRODUCT_ID: productId,
    TRADE_ID: tradeId,
    TITLE: toText(
      item.TITLE ?? item.title ?? item.PRODUCT_TITLE ?? item.productTitle,
      "상품명 없음",
    ),
    BASE_PRICE: toNumber(
      item.BASE_PRICE ?? item.basePrice ?? item.PRICE ?? item.price,
    ),
    PRODUCT_STATUS_CODE: toText(
      item.PRODUCT_STATUS_CODE ??
        item.productStatusCode ??
        item.TRADE_STATUS_CODE ??
        item.tradeStatusCode,
      "",
    ),
    IMAGE_URL: toText(
      item.IMAGE_URL ??
        item.imageUrl ??
        item.PRODUCT_IMAGE_URL ??
        item.productImageUrl,
      "",
    ),
    LOCKER_ID: lockerId,
    LOCKER_NO: lockerNo,
  };
}

function extractProductArray(response: unknown): unknown[] {
  const unwrapped = unwrapResponse<unknown>(response);

  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }

  if (typeof unwrapped !== "object" || unwrapped === null) {
    return [];
  }

  const objectValue = unwrapped as Record<string, unknown>;

  const candidates = [
    objectValue.list,
    objectValue.items,
    objectValue.products,
    objectValue.productList,
    objectValue.PRODUCT_LIST,
    objectValue.BUYER_PRODUCT_LIST,
    objectValue.data,
    objectValue.result,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

export default function KioskBuyerInspectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authCode } = useParams();

  const state = (location.state || {}) as InspectionLocationState;

  const normalizedAuthCode =
    authCode ||
    state.authCode ||
    sessionStorage.getItem("buyerCheckAuthCode") ||
    sessionStorage.getItem("buyerInspectionAuthCode") ||
    "";

  const normalizedKioskCode =
    state.kioskCode ||
    localStorage.getItem("KIOSK_CODE") ||
    localStorage.getItem("kioskCode") ||
    sessionStorage.getItem("kioskCode") ||
    "";

  const [phase, setPhase] = useState<InspectionPhase>(
    state.product && state.locker ? "PREPARING" : "LOADING_PRODUCTS",
  );

  const [products, setProducts] = useState<BuyerCheckProduct[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<BuyerCheckProduct | null>(state.product || null);
  const [selectedLocker, setSelectedLocker] =
    useState<BuyerLockerResult | null>(state.locker || null);

  const [sellerStoredImageUrl, setSellerStoredImageUrl] = useState(
    normalizeImageUrl(state.sellerStoredImageUrl) ||
      normalizeImageUrl(state.product?.IMAGE_URL) ||
      cameraModuleImage,
  );

  const [currentCaptureImageUrl, setCurrentCaptureImageUrl] = useState(
    normalizeImageUrl(state.currentCaptureImageUrl) || cameraModuleImage,
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const startedRef = useRef(false);

  const phaseText = useMemo(() => {
    if (phase === "LOADING_PRODUCTS") {
      return {
        title: "구매 상품을 조회하고 있습니다.",
        description:
          "인증 정보를 기준으로 확인 가능한 보관함 거래를 불러옵니다.",
        subDescription: "잠시만 기다려주세요.",
      };
    }

    if (phase === "SELECT_PRODUCT") {
      return {
        title: "확인할 물품을 선택해주세요.",
        description: "구매한 보관함 거래 중 확인할 물품을 선택합니다.",
        subDescription: "상품을 선택하면 보관함 내부 확인을 시작합니다.",
      };
    }

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

  async function selectBuyerProductList() {
    const response = await requestJson<unknown>(
      "/kiosk/buyer/product",
      {
        method: "GET",
      },
      {
        AUTH_CODE: normalizedAuthCode,
        KIOSK_CODE: normalizedKioskCode,
      },
    );

    return extractProductArray(response).map(normalizeBuyerProduct);
  }

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

  async function selectBuyerInspectionStatus(
    tradeId: number,
    lockerId: number,
  ) {
    const response = await requestJson<CommandStatusResponse>(
      "/kiosk/locker/command/status/select",
      {
        method: "GET",
      },
      {
        AUTH_CODE: normalizedKioskCode,
        KIOSK_CODE: normalizedKioskCode,
        LOCKER_ID: lockerId,
        LOCKER_STATUS_NAME: "BUYER_INSPECTION_READY",
      },
    );

    return unwrapResponse<CommandStatusResponse>(response);
  }

  async function updateLockerToBuyerInspectionReady(tradeId: number) {
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

  async function updateLockerToBuyerItemConfirmed(tradeId: number) {
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

  async function selectLockerImages(tradeId: number, lockerId: number) {
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

  async function waitUntilBuyerInspectionSuccess(
    tradeId: number,
    lockerId: number,
  ) {
    const maxTryCount = 30;

    for (let i = 0; i < maxTryCount; i += 1) {
      const status = await selectBuyerInspectionStatus(tradeId, lockerId);

      if (status.CHECK_STATUS === "SUCCESS") {
        return status;
      }

      if (status.CHECK_STATUS === "FAILED") {
        throw new Error(
          status.RESULT_MESSAGE ||
            `${
              status.FAILED_COMMAND_TYPE_CODE || "BUYER_INSPECTION_READY"
            } 명령이 실패했습니다.`,
        );
      }

      await sleep(1000);
    }

    throw new Error("라즈베리파이 명령 성공 확인 시간이 초과되었습니다.");
  }

  async function loadBuyerProducts() {
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

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setPhase("LOADING_PRODUCTS");

      const list = await selectBuyerProductList();

      setProducts(list);
      setPhase("SELECT_PRODUCT");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "구매자 물품 목록 조회 중 알 수 없는 오류가 발생했습니다.";

      setErrorMessage(message);
      setPhase("ERROR");
    } finally {
      setIsProcessing(false);
    }
  }

  async function prepareBuyerInspection(
    product: BuyerCheckProduct | null,
    locker: BuyerLockerResult | null,
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

    if (!product || !locker) {
      setErrorMessage("선택된 상품 또는 보관함 정보가 없습니다.");
      setPhase("ERROR");
      return;
    }

    const tradeId = locker.TRADE_ID || product.TRADE_ID;
    const lockerId = locker.LOCKER_ID || product.LOCKER_ID || 0;

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

      await waitUntilBuyerInspectionSuccess(tradeId, lockerId);

      await updateLockerToBuyerInspectionReady(tradeId);

      const images = await selectLockerImages(tradeId, lockerId);

      setSellerStoredImageUrl(
        normalizeImageUrl(images.SELLER_IMAGE_URL) ||
          normalizeImageUrl(state.sellerStoredImageUrl) ||
          normalizeImageUrl(product.IMAGE_URL) ||
          cameraModuleImage,
      );

      setCurrentCaptureImageUrl(
        normalizeImageUrl(images.BUYER_IMAGE_URL) ||
          normalizeImageUrl(state.currentCaptureImageUrl) ||
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

    if (state.product && state.locker) {
      prepareBuyerInspection(state.product, state.locker, "NORMAL");
      return;
    }

    loadBuyerProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGoHome() {
    navigate("/kiosk");
  }

  function handleSelectProduct(product: BuyerCheckProduct) {
    const lockerId = product.LOCKER_ID || 0;
    const lockerNo = product.LOCKER_NO || lockerId;

    if (!product.TRADE_ID || !product.PRODUCT_ID || !lockerId) {
      setErrorMessage(
        "선택한 상품에 TRADE_ID, PRODUCT_ID, LOCKER_ID 정보가 없습니다.",
      );
      setPhase("ERROR");
      return;
    }

    const locker: BuyerLockerResult = {
      TRADE_ID: product.TRADE_ID,
      PRODUCT_ID: product.PRODUCT_ID,
      LOCKER_ID: lockerId,
      LOCKER_NO: lockerNo,
    };

    setSelectedProduct(product);
    setSelectedLocker(locker);

    sessionStorage.setItem("buyerInspectionAuthCode", normalizedAuthCode);
    sessionStorage.setItem("buyerInspectionTradeId", String(product.TRADE_ID));
    sessionStorage.setItem(
      "buyerInspectionProductId",
      String(product.PRODUCT_ID),
    );
    sessionStorage.setItem("buyerInspectionProductTitle", product.TITLE);
    sessionStorage.setItem(
      "buyerInspectionProductPrice",
      String(product.BASE_PRICE),
    );
    sessionStorage.setItem(
      "buyerInspectionProductImageUrl",
      product.IMAGE_URL || "",
    );
    sessionStorage.setItem("buyerInspectionLockerId", String(lockerId));
    sessionStorage.setItem("buyerInspectionLockerNo", String(lockerNo));

    prepareBuyerInspection(product, locker, "NORMAL");
  }

  function handleRetryCapture() {
    prepareBuyerInspection(selectedProduct, selectedLocker, "RETRY");
  }

  async function handleConfirmItem() {
    if (!selectedProduct || !selectedLocker) {
      setErrorMessage("선택된 상품 또는 보관함 정보가 없습니다.");
      setPhase("ERROR");
      return;
    }

    const tradeId = selectedLocker.TRADE_ID || selectedProduct.TRADE_ID;

    if (!tradeId) {
      setErrorMessage("TRADE_ID가 없습니다. 거래 정보를 다시 확인해주세요.");
      setPhase("ERROR");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");

      await updateLockerToBuyerItemConfirmed(tradeId);

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
    if (!selectedProduct || !selectedLocker) {
      setErrorMessage("선택된 상품 또는 보관함 정보가 없습니다.");
      setPhase("ERROR");
      return;
    }

    navigate("/kiosk/pickup", {
      state: {
        authCode: normalizedAuthCode,
        kioskCode: normalizedKioskCode,
        product: selectedProduct,
        locker: selectedLocker,
        sellerStoredImageUrl,
        currentCaptureImageUrl,
      },
    });
  }

  const selectedProductImageUrl =
    normalizeImageUrl(selectedProduct?.IMAGE_URL) || cameraModuleImage;

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

        {selectedProduct && selectedLocker && (
          <div className={styles.summaryBox}>
            <div className={styles.summaryProduct}>
              <div className={styles.summaryImageBox}>
                <img
                  src={selectedProductImageUrl}
                  alt={selectedProduct.TITLE}
                  className={styles.summaryImage}
                />
              </div>

              <div className={styles.summaryInfo}>
                <span>선택 상품</span>
                <strong>{selectedProduct.TITLE}</strong>
                <p>{formatPrice(selectedProduct.BASE_PRICE)}</p>
              </div>
            </div>

            <div className={styles.summaryLocker}>
              <span>확인할 보관함</span>
              <strong>{selectedLocker.LOCKER_NO}번</strong>
            </div>
          </div>
        )}

        <div
          className={`${styles.inspectionPanel} ${
            phase === "DONE" ? styles.inspectionPanelDone : ""
          }`}
        >
          {phase === "LOADING_PRODUCTS" && (
            <>
              <div className={styles.prepareImageBox}>
                <img
                  src={cameraModuleImage}
                  alt="상품 조회 중"
                  className={styles.prepareImage}
                />
              </div>

              <h2>{phaseText.title}</h2>
              <p>{phaseText.description}</p>
              <span>{phaseText.subDescription}</span>

              <button type="button" className={styles.secondaryButton} disabled>
                {isProcessing ? "조회 중..." : "조회 준비 중"}
              </button>
            </>
          )}

          {phase === "SELECT_PRODUCT" && (
            <>
              <h2>{phaseText.title}</h2>
              <p>{phaseText.description}</p>

              {products.length === 0 ? (
                <>
                  <span className={styles.compareGuide}>
                    확인 가능한 구매 상품이 없습니다.
                  </span>

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
                      onClick={loadBuyerProducts}
                      disabled={isProcessing}
                    >
                      다시 조회
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: "16px",
                      marginTop: "20px",
                    }}
                  >
                    {products.map((item, index) => {
                      const imageUrl =
                        normalizeImageUrl(item.IMAGE_URL) || cameraModuleImage;

                      return (
                        <button
                          key={`${item.TRADE_ID}-${item.PRODUCT_ID}-${
                            item.LOCKER_ID || index
                          }`}
                          type="button"
                          className={styles.summaryBox}
                          style={{
                            width: "100%",
                            cursor: "pointer",
                            border: "none",
                            textAlign: "left",
                          }}
                          onClick={() => handleSelectProduct(item)}
                          disabled={isProcessing}
                        >
                          <div className={styles.summaryProduct}>
                            <div className={styles.summaryImageBox}>
                              <img
                                src={imageUrl}
                                alt={item.TITLE}
                                className={styles.summaryImage}
                              />
                            </div>

                            <div className={styles.summaryInfo}>
                              <span>구매 상품</span>
                              <strong>{item.TITLE}</strong>
                              <p>{formatPrice(item.BASE_PRICE)}</p>
                            </div>
                          </div>

                          <div className={styles.summaryLocker}>
                            <span>보관함</span>
                            <strong>
                              {item.LOCKER_NO || item.LOCKER_ID}번
                            </strong>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <span className={styles.compareGuide}>
                    {phaseText.subDescription}
                  </span>
                </>
              )}
            </>
          )}

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
                  onClick={() => {
                    if (selectedProduct && selectedLocker) {
                      prepareBuyerInspection(
                        selectedProduct,
                        selectedLocker,
                        "RETRY",
                      );
                      return;
                    }

                    loadBuyerProducts();
                  }}
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
