import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import logoImage from "../../../assets/images/Loocker.png";
import { kioskApi, type KioskBuyerProduct } from "../api/kioskApi";
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

type BuyerCheckProductSession = {
  PRODUCT_ID: number;
  TRADE_ID: number;
  TITLE: string;
  BASE_PRICE: number;
  PRODUCT_STATUS_CODE: string;
  IMAGE_URL?: string;
};

type BuyerCheckLockerSession = {
  TRADE_ID: number;
  PRODUCT_ID: number;
  LOCKER_ID: number;
  LOCKER_NO: number;
};

function formatPrice(price?: number) {
  if (typeof price !== "number") return "-";
  return `${price.toLocaleString()}원`;
}

function getProductStatusLabel(status?: string | null) {
  if (!status) return "보관 완료";

  const map: Record<string, string> = {
    PR_01: "판매중",
    PR_02: "예약중",
    PR_03: "거래중",
    PR_04: "판매 완료",
    TRADING: "거래중",
    DEPOSITED: "보관 완료",
    ITEM_CHECK: "물품 확인",
    PAID: "결제 완료",
    PICKEDUP: "수령 완료",
  };

  return map[status] ?? status;
}

function extractCleanErrorMessage(message?: string) {
  if (!message) return "요청 처리 중 오류가 발생했습니다.";

  const knownMessages = [
    "키오스크 인증 정보가 만료 되었습니다.",
    "존재하지 않는 인증 코드입니다.",
    "이미 인증 완료된 코드입니다.",
    "유효하지 않은 키오스크입니다.",
    "확인 가능한 구매 상품이 없습니다.",
    "상품 정보가 없습니다.",
    "보관함 정보를 확인할 수 없습니다.",
    "거래 ID가 없습니다.",
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

export default function KioskBuyerCheckProductPage() {
  const navigate = useNavigate();
  const { authCode } = useParams();

  const normalizedAuthCode = authCode || getBuyerCheckAuthCode();
  const kioskCode =
    localStorage.getItem("kioskCode") || getBuyerCheckKioskCode();

  const [products, setProducts] = useState<KioskBuyerProduct[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [lockerLoading, setLockerLoading] = useState(false);

  const selectedProduct = useMemo(() => {
    return products.find((item) => Number(item.TRADE_ID) === selectedTradeId);
  }, [products, selectedTradeId]);

  function handleGoHome() {
    navigate("/kiosk");
  }

  function moveToInspection(params: {
    product: BuyerCheckProductSession;
    locker: BuyerCheckLockerSession;
    sellerStoredImageUrl?: string;
    currentCaptureImageUrl?: string;
  }) {
    saveBuyerCheckAuthSession({
      AUTH_CODE: normalizedAuthCode,
      KIOSK_CODE: kioskCode,
    });

    saveBuyerCheckProduct(params.product);
    saveBuyerCheckLocker(params.locker);
    saveBuyerCheckImages({
      sellerStoredImageUrl: params.sellerStoredImageUrl || "",
      currentCaptureImageUrl: params.currentCaptureImageUrl || "",
    });

    navigate(`/kiosk/buyer/check/inspection/${normalizedAuthCode}`, {
      state: {
        authCode: normalizedAuthCode,
        kioskCode,
        product: params.product,
        locker: params.locker,
        sellerStoredImageUrl: params.sellerStoredImageUrl || "",
        currentCaptureImageUrl: params.currentCaptureImageUrl || "",
      },
    });
  }

  useEffect(() => {
    async function fetchBuyerProducts() {
      if (!normalizedAuthCode || !kioskCode) {
        setMessage("인증 정보 또는 키오스크 정보가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setMessage("");

        saveBuyerCheckAuthSession({
          AUTH_CODE: normalizedAuthCode,
          KIOSK_CODE: kioskCode,
        });

        const result = await kioskApi.selectBuyerProducts({
          AUTH_CODE: normalizedAuthCode,
          KIOSK_CODE: kioskCode,
        });

        setProducts(result);
      } catch (error) {
        const rawMessage =
          error instanceof Error
            ? error.message
            : "구매 상품 목록을 불러오지 못했습니다.";

        setMessage(extractCleanErrorMessage(rawMessage));
      } finally {
        setLoading(false);
      }
    }

    fetchBuyerProducts();
  }, [normalizedAuthCode, kioskCode]);

  async function handleNext() {
    if (!selectedProduct) {
      setMessage("확인할 상품을 선택해주세요.");
      return;
    }

    if (!normalizedAuthCode || !kioskCode) {
      setMessage("인증 정보 또는 키오스크 정보가 없습니다.");
      return;
    }

    const tradeId = Number(selectedProduct.TRADE_ID);

    if (!tradeId) {
      setMessage(
        "거래 ID가 없습니다. /kiosk/buyer/product 응답의 TRADE_ID를 확인해주세요.",
      );
      return;
    }

    try {
      setLockerLoading(true);
      setMessage("");

      const lockerResult = await kioskApi.selectBuyerLocker({
        AUTH_CODE: normalizedAuthCode,
        TRADE_ID: tradeId,
        KIOSK_CODE: kioskCode,
      });

      const productImageUrl = selectedProduct.IMAGE_URL
        ? toApiAssetUrl(selectedProduct.IMAGE_URL)
        : "";

      const sellerStoredImageUrl =
        lockerResult.SELLER_IMAGE_URL ||
        lockerResult.IMAGE_URL ||
        selectedProduct.IMAGE_URL ||
        "";

      const currentCaptureImageUrl =
        lockerResult.CURRENT_IMAGE_URL ||
        lockerResult.IMAGE_URL ||
        selectedProduct.IMAGE_URL ||
        "";

      const normalizedProduct: BuyerCheckProductSession = {
        PRODUCT_ID: selectedProduct.PRODUCT_ID,
        TRADE_ID: tradeId,
        TITLE: selectedProduct.TITLE,
        BASE_PRICE: selectedProduct.BASE_PRICE,
        PRODUCT_STATUS_CODE: selectedProduct.PRODUCT_STATUS_CODE || "",
        IMAGE_URL: productImageUrl,
      };

      const normalizedLocker: BuyerCheckLockerSession = {
        TRADE_ID: tradeId,
        PRODUCT_ID: lockerResult.PRODUCT_ID || selectedProduct.PRODUCT_ID,
        LOCKER_ID: lockerResult.LOCKER_ID,
        LOCKER_NO: lockerResult.LOCKER_NO || lockerResult.LOCKER_ID,
      };

      moveToInspection({
        product: normalizedProduct,
        locker: normalizedLocker,
        sellerStoredImageUrl: sellerStoredImageUrl
          ? toApiAssetUrl(sellerStoredImageUrl)
          : productImageUrl,
        currentCaptureImageUrl: currentCaptureImageUrl
          ? toApiAssetUrl(currentCaptureImageUrl)
          : productImageUrl,
      });
    } catch (error) {
      const rawMessage =
        error instanceof Error
          ? error.message
          : "보관함 정보를 불러오지 못했습니다.";

      setMessage(extractCleanErrorMessage(rawMessage));
    } finally {
      setLockerLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <img src={logoImage} alt="Loocker" className={styles.logo} />

        <button
          type="button"
          className={styles.homeButton}
          onClick={handleGoHome}
          disabled={lockerLoading}
        >
          처음으로
        </button>
      </header>

      <section className={styles.productCard}>
        <h1 className={styles.title}>확인할 상품 선택</h1>

        <p className={styles.description}>
          현재 키오스크 보관함에 보관된 구매 상품을 선택해주세요.
        </p>

        {loading && (
          <p className={styles.centerMessage}>구매 상품 조회 중...</p>
        )}

        {!loading && products.length === 0 && !message && (
          <div className={styles.emptyBox}>
            <p>확인 가능한 구매 상품이 없습니다.</p>
            <span>구매자의 보관함 거래 상품이 조회되지 않았습니다.</span>
          </div>
        )}

        {!loading && message && (
          <div className={styles.emptyBox}>
            <p>{message}</p>
            <span>인증 정보 또는 거래 상태를 다시 확인해주세요.</span>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className={styles.productList}>
            {products.map((product) => {
              const tradeId = Number(product.TRADE_ID);
              const selected = selectedTradeId === tradeId;
              const imageSrc = product.IMAGE_URL
                ? toApiAssetUrl(product.IMAGE_URL)
                : "";

              return (
                <button
                  key={`${product.PRODUCT_ID}-${tradeId || "no-trade"}`}
                  type="button"
                  className={`${styles.productItem} ${
                    selected ? styles.productItemSelected : ""
                  }`}
                  disabled={lockerLoading}
                  onClick={() => {
                    if (!tradeId) {
                      setSelectedTradeId(null);
                      setMessage(
                        "거래 ID가 없는 상품입니다. /kiosk/buyer/product 응답을 확인해주세요.",
                      );
                      return;
                    }

                    setSelectedTradeId(tradeId);
                    setMessage("");
                  }}
                >
                  <div className={styles.productImageBox}>
                    {imageSrc ? (
                      <img
                        src={imageSrc}
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
                    <p>{getProductStatusLabel(product.PRODUCT_STATUS_CODE)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.bottomButtonBox}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleNext}
            disabled={!selectedTradeId || lockerLoading}
          >
            {lockerLoading ? "보관함 확인 중..." : "선택 상품 보관함 확인"}
          </button>
        </div>
      </section>
    </main>
  );
}
