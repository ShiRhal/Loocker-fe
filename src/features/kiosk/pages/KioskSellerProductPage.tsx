import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { kioskApi, type KioskSellerProduct } from "../api/kioskApi";
import { kioskAuthApi } from "../api/kioskAuthApi";
import styles from "../styles/kiosk.module.css";
import logoImage from "../../../assets/images/Loocker.png";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";
import {
  clearSellerDepositSession,
  getSellerDepositExpireWatchDelay,
  SELLER_DEPOSIT_PRODUCT_ID_KEY,
  SELLER_DEPOSIT_PRODUCT_TITLE_KEY,
  SELLER_DEPOSIT_TRADE_ID_KEY,
} from "../utils/sellerDepositSession";

type KioskLockerAssignResult = {
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function formatPrice(price?: number) {
  if (typeof price !== "number") return "-";
  return `${price.toLocaleString()}원`;
}

function extractCleanErrorMessage(message?: string) {
  if (!message) return "요청 처리 중 오류가 발생했습니다.";

  const knownMessages = [
    "사용 가능한 빈 보관함이 없습니다.",
    "키오스크 인증 정보가 만료 되었습니다.",
    "존재하지 않는 인증 코드입니다.",
    "이미 인증 완료된 코드입니다.",
    "유효하지 않은 키오스크입니다.",
    "보관할 상품 정보가 없습니다.",
    "상품 정보가 없습니다.",
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

async function requestSellerLockerAssign(params: {
  AUTH_CODE: string;
  PRODUCT_ID: number;
  KIOSK_CODE: string;
}) {
  const query = new URLSearchParams({
    AUTH_CODE: params.AUTH_CODE,
    PRODUCT_ID: String(params.PRODUCT_ID),
    KIOSK_CODE: params.KIOSK_CODE,
  });

  const token = localStorage.getItem("kioskAccessToken") || "";

  const res = await fetch(
    `${API_BASE_URL}/kiosk/seller/locker?${query.toString()}`,
    {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  const contentType = res.headers.get("content-type") || "";

  let data: any = null;

  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const rawErrorMessage =
      typeof data === "string"
        ? data
        : data?.message || data?.error || "보관함 배정에 실패했습니다.";

    throw new Error(extractCleanErrorMessage(rawErrorMessage));
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.LOCKER_ID) {
    throw new Error("배정된 보관함 정보를 확인할 수 없습니다.");
  }

  return result as KioskLockerAssignResult;
}

export default function KioskSellerProductPage() {
  const navigate = useNavigate();
  const { authCode } = useParams();

  const [products, setProducts] = useState<KioskSellerProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);

  const expireWatchTimeoutRef = useRef<number | null>(null);
  const expirePollingRef = useRef<number | null>(null);

  const kioskCode = localStorage.getItem("kioskCode") || "";
  const normalizedAuthCode =
    authCode || sessionStorage.getItem("sellerDepositAuthCode") || "";

  function handleGoHome() {
    clearSellerDepositSession();
    navigate("/kiosk");
  }

  useEffect(() => {
    if (!normalizedAuthCode || !kioskCode) return;

    async function checkExpired() {
      try {
        const result = await kioskAuthApi.selectAuthSession({
          AUTH_CODE: normalizedAuthCode,
          KIOSK_CODE: kioskCode,
        });

        if (result?.AUTH_STATUS_CODE === "EXPIRED") {
          clearSellerDepositSession();

          if (expirePollingRef.current) {
            window.clearInterval(expirePollingRef.current);
            expirePollingRef.current = null;
          }

          navigate("/kiosk/error", {
            replace: true,
            state: {
              message:
                "인증 시간이 만료되었습니다. 처음부터 다시 진행해주세요.",
            },
          });
        }
      } catch {
        return;
      }
    }

    const delay = getSellerDepositExpireWatchDelay();

    expireWatchTimeoutRef.current = window.setTimeout(() => {
      checkExpired();
      expirePollingRef.current = window.setInterval(checkExpired, 1000);
    }, delay);

    return () => {
      if (expireWatchTimeoutRef.current) {
        window.clearTimeout(expireWatchTimeoutRef.current);
        expireWatchTimeoutRef.current = null;
      }

      if (expirePollingRef.current) {
        window.clearInterval(expirePollingRef.current);
        expirePollingRef.current = null;
      }
    };
  }, [normalizedAuthCode, kioskCode, navigate]);

  useEffect(() => {
    async function fetchProducts() {
      if (!normalizedAuthCode || !kioskCode) {
        setMessage("인증 정보 또는 키오스크 정보가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setMessage("");

        sessionStorage.setItem("sellerDepositAuthCode", normalizedAuthCode);

        const result = await kioskApi.selectSellerProducts({
          AUTH_CODE: normalizedAuthCode,
          KIOSK_CODE: kioskCode,
        });

        setProducts(result);
      } catch (error) {
        const rawMessage =
          error instanceof Error
            ? error.message
            : "상품 목록을 불러오지 못했습니다.";

        setMessage(extractCleanErrorMessage(rawMessage));
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [normalizedAuthCode, kioskCode]);

  async function handleNext() {
    const selected = products.find(
      (product) => product.PRODUCT_ID === selectedProductId,
    );

    if (!selected) {
      setMessage("보관할 상품을 선택해주세요.");
      return;
    }

    if (!normalizedAuthCode || !kioskCode) {
      setMessage("인증 정보 또는 키오스크 정보가 없습니다.");
      return;
    }

    try {
      setAssignLoading(true);
      setMessage("");

      sessionStorage.setItem(
        SELLER_DEPOSIT_PRODUCT_ID_KEY,
        String(selected.PRODUCT_ID),
      );
      sessionStorage.setItem(SELLER_DEPOSIT_PRODUCT_TITLE_KEY, selected.TITLE);

      if (selected.TRADE_ID) {
        sessionStorage.setItem(
          SELLER_DEPOSIT_TRADE_ID_KEY,
          String(selected.TRADE_ID),
        );
      }

      const assignResult = await requestSellerLockerAssign({
        AUTH_CODE: normalizedAuthCode,
        PRODUCT_ID: selected.PRODUCT_ID,
        KIOSK_CODE: kioskCode,
      });

      navigate(`/kiosk/seller/deposit/locker/assign/${normalizedAuthCode}`, {
        state: {
          ...selected,
          ...assignResult,
          PRODUCT_ID: selected.PRODUCT_ID,
          TITLE: selected.TITLE,
          IMAGE_URL: selected.IMAGE_URL,
          TRADE_ID: selected.TRADE_ID,
        },
      });
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : "보관함 배정에 실패했습니다.";

      setMessage(extractCleanErrorMessage(rawMessage));
    } finally {
      setAssignLoading(false);
    }
  }

  return (
    <main className={styles.productPage}>
      <header className={styles.authHeader}>
        <img className={styles.authLogo} src={logoImage} alt="Loocker" />

        <button
          className={styles.authHomeButton}
          type="button"
          onClick={handleGoHome}
          disabled={assignLoading}
        >
          처음으로
        </button>
      </header>

      <section className={styles.productCard}>
        <h1 className={styles.authTitle}>보관할 상품 선택</h1>

        <p className={styles.authDescription}>
          현재 키오스크 지점에 보관할 상품을 선택해주세요.
        </p>

        {loading && (
          <p className={styles.kioskCenterMessage}>상품 조회 중...</p>
        )}

        {!loading && message && (
          <p className={styles.kioskErrorMessage}>{message}</p>
        )}

        {!loading && products.length === 0 && !message && (
          <p className={styles.kioskCenterMessage}>
            보관 가능한 상품이 없습니다.
          </p>
        )}

        <div className={styles.kioskProductList}>
          {products.map((product) => {
            const selected = selectedProductId === product.PRODUCT_ID;
            const imageSrc = product.IMAGE_URL
              ? toApiAssetUrl(product.IMAGE_URL)
              : "";

            return (
              <button
                key={product.PRODUCT_ID}
                className={`${styles.kioskProductItem} ${
                  selected ? styles.kioskProductItemSelected : ""
                }`}
                type="button"
                disabled={assignLoading}
                onClick={() => {
                  setSelectedProductId(product.PRODUCT_ID);
                  setMessage("");
                }}
              >
                <div className={styles.kioskProductImageBox}>
                  {imageSrc ? (
                    <img
                      className={styles.kioskProductImage}
                      src={imageSrc}
                      alt={product.TITLE}
                    />
                  ) : (
                    <div className={styles.kioskNoImage}>NO IMAGE</div>
                  )}
                </div>

                <div className={styles.kioskProductInfo}>
                  <h2>{product.TITLE}</h2>
                  <p>{formatPrice(product.BASE_PRICE)}</p>
                  <span>상품 ID: {product.PRODUCT_ID}</span>
                </div>
              </button>
            );
          })}
        </div>

        <button
          className={styles.primaryWideButton}
          type="button"
          onClick={handleNext}
          disabled={!selectedProductId || assignLoading}
        >
          {assignLoading ? "보관함 배정 중..." : "다음"}
        </button>
      </section>
    </main>
  );
}
