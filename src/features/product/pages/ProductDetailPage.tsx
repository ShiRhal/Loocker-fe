import { Fragment, useEffect, useRef, useState } from "react";
import { message } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import RecentViewedBox from "../../home/components/RecentViewedBox";
import { productApi } from "../api/productapi";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";
import styles from "./ProductDetailPage.module.css";
import { addRecentViewedProduct } from "../../../shared/utils/recentViewedStorage";
import TradeMethodDrawer from "../../trade/drawers/TradeMethodDrawer";
import { tradeApi } from "../../trade/api/tradeApi";
import type { ProductTradePreview } from "../../trade/types/trade.types";

type TradeTypeCode = "DIRECT" | "LOCKER" | "DELIVERY";

type ProductImage = {
  IMAGE_ID: number;
  PRODUCT_ID: number;
  IMAGE_URL: string;
  IS_PRIMARY: boolean | number;
  SORT_ORDER: number;
  CREATED_AT: string;
};

type ProductDetail = {
  PRODUCT_ID: number;
  TITLE: string;
  DESCRIPTION: string;
  BASE_PRICE: number;
  IMAGE?: ProductImage[];
  ACCESSORY_STATUS?: string;
  TRADE_TYPE?: string;
  STATE?: string | null;
  CITY?: string | null;
  MAIN_CATEGORY?: string;
  SUB_CATEGORY?: string;
  STATUS_CODE?: string;
  VIEW_COUNT?: number;
  WISH_COUNT?: number;
  CHAT_COUNT?: number;
  CREATED_AT?: string;
  NICKNAME?: string;
};

const TRADE_TYPE_LABEL: Record<TradeTypeCode, string> = {
  DIRECT: "직거래",
  LOCKER: "보관함 거래",
  DELIVERY: "택배거래",
};

const ACCESSORY_STATUS_LABEL: Record<string, string> = {
  ALL: "구성품 전부 포함",
  PARTIAL: "구성품 일부 포함",
  NONE: "구성품 미포함",
};

function formatPrice(price?: number) {
  if (price == null) return "가격 정보 없음";
  return `${price.toLocaleString()}원`;
}

function formatCreatedAt(createdAt?: string) {
  if (!createdAt) return "";

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isPrimaryImage(image: ProductImage) {
  return image.IS_PRIMARY === true || image.IS_PRIMARY === 1;
}

function getProductImageUrls(images?: ProductImage[]) {
  if (!images || images.length === 0) return [];

  return [...images]
    .sort((a, b) => {
      const aPrimary = isPrimaryImage(a);
      const bPrimary = isPrimaryImage(b);

      if (aPrimary !== bPrimary) {
        return aPrimary ? -1 : 1;
      }

      return (a.SORT_ORDER ?? 0) - (b.SORT_ORDER ?? 0);
    })
    .map((image) => toApiAssetUrl(image.IMAGE_URL));
}

function getPrimaryImageUrl(images?: ProductImage[]) {
  const imageUrls = getProductImageUrls(images);
  return imageUrls[0] ?? "";
}

function getTradeTypes(tradeType?: string): TradeTypeCode[] {
  if (!tradeType) return [];

  return tradeType
    .split("|")
    .map((value) => value.trim())
    .filter((value): value is TradeTypeCode =>
      ["DIRECT", "LOCKER", "DELIVERY"].includes(value),
    );
}

function getTradeLabel(type: TradeTypeCode) {
  return TRADE_TYPE_LABEL[type];
}

function getAccessoryStatusLabel(status?: string) {
  if (!status) return "상품 상태 정보 없음";
  return ACCESSORY_STATUS_LABEL[status] ?? status;
}

function getLocationText(state?: string | null, city?: string | null) {
  return [state, city].filter(Boolean).join(" ");
}

function toProductTradePreview(product: ProductDetail): ProductTradePreview {
  return {
    productId: product.PRODUCT_ID,
    title: product.TITLE,
    imageUrl: getPrimaryImageUrl(product.IMAGE),
    expectedPrice: product.BASE_PRICE,
    tradeType: product.TRADE_TYPE ?? "",
  };
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const paymentHandledRef = useRef(false);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isTradeBoxOpen, setIsTradeBoxOpen] = useState(true);
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const [initialTradeId, setInitialTradeId] = useState<number | null>(null);
  const [initialPaid, setInitialPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [productId]);

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!productId) {
        setError("상품 ID가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const detail = await productApi.getProductDetail(Number(productId));

        setProduct(detail);
        setSelectedImageIndex(0);
        setIsTradeBoxOpen(true);

        addRecentViewedProduct({
          id: detail.PRODUCT_ID,
          title: detail.TITLE,
          price: detail.BASE_PRICE,
          imageUrl: getPrimaryImageUrl(detail.IMAGE),
        });
      } catch (err) {
        console.error(err);
        setError("상품 상세 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get("payment");

    if (!payment) {
      paymentHandledRef.current = false;
      return;
    }

    if (paymentHandledRef.current) return;

    const cleanUrl = `/product/${productId}`;

    const handlePaymentResult = async () => {
      if (payment === "fail") {
        paymentHandledRef.current = true;
        sessionStorage.removeItem("pendingPayment");

        message.error("결제가 실패했습니다.");
        navigate(cleanUrl, { replace: true });
        return;
      }

      if (payment !== "success") return;

      const tradeId = params.get("tradeId");
      const paymentKey = params.get("paymentKey");
      const orderId = params.get("orderId");
      const amount = params.get("amount");

      const numericTradeId = Number(tradeId);
      const numericAmount = Number(amount);

      if (!numericTradeId || Number.isNaN(numericTradeId)) {
        paymentHandledRef.current = true;
        sessionStorage.removeItem("pendingPayment");

        message.error("거래 ID를 확인할 수 없습니다.");
        navigate(cleanUrl, { replace: true });
        return;
      }

      if (!paymentKey || !orderId || !amount || Number.isNaN(numericAmount)) {
        paymentHandledRef.current = true;
        sessionStorage.removeItem("pendingPayment");

        message.error("결제 승인 정보를 확인할 수 없습니다.");
        navigate(cleanUrl, { replace: true });
        return;
      }

      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        paymentHandledRef.current = true;
        sessionStorage.removeItem("pendingPayment");

        message.error("로그인이 필요합니다.");
        navigate(cleanUrl, { replace: true });
        return;
      }

      try {
        paymentHandledRef.current = true;

        await tradeApi.updatePaymentPaid(accessToken, {
          TRADE_ID: numericTradeId,
          AMOUNT: numericAmount,
          ORDER_ID: orderId,
          PAYMENT_KEY: paymentKey,
        });

        await tradeApi.updateTradeStatus(accessToken, {
          TRADE_ID: numericTradeId,
          RESULT_STATUS_CODE: "TRADING",
          NEXT_STATUS_CODE: "PAID",
          TRADE_TYPE_CODE: "DELIVERY",
          USER_ID: 0,
        });

        sessionStorage.removeItem("pendingPayment");

        setInitialTradeId(numericTradeId);
        setInitialPaid(true);
        setTradeDrawerOpen(true);

        navigate(cleanUrl, { replace: true });
      } catch (err) {
        console.error(err);
        sessionStorage.removeItem("pendingPayment");

        message.error("결제 승인 처리에 실패했습니다.");
        navigate(cleanUrl, { replace: true });
      }
    };

    handlePaymentResult();
  }, [location.search, navigate, productId]);

  const handleOpenTradeDrawer = () => {
    setInitialTradeId(null);
    setInitialPaid(false);
    setTradeDrawerOpen(true);
  };

  const handleCloseTradeDrawer = () => {
    setTradeDrawerOpen(false);
    setInitialTradeId(null);
    setInitialPaid(false);
  };

  if (loading) {
    return (
      <main className={styles.message}>상품 정보를 불러오는 중입니다.</main>
    );
  }

  if (error) {
    return <main className={styles.message}>{error}</main>;
  }

  if (!product) {
    return <main className={styles.message}>상품 정보가 없습니다.</main>;
  }

  const imageUrls = getProductImageUrls(product.IMAGE);
  const selectedImageUrl = imageUrls[selectedImageIndex] ?? "";
  const createdAtText = formatCreatedAt(product.CREATED_AT);
  const tradeTypes = getTradeTypes(product.TRADE_TYPE);
  const locationText = getLocationText(product.STATE, product.CITY);
  const hasRegion = Boolean(locationText);
  const accessoryStatusText = getAccessoryStatusLabel(product.ACCESSORY_STATUS);
  const tradePreview = toProductTradePreview(product);

  return (
    <div className={styles.pageShell}>
      <main className={styles.page}>
        <section className={styles.topSection}>
          <div className={styles.imageArea}>
            {selectedImageUrl ? (
              <img
                src={selectedImageUrl}
                alt={product.TITLE}
                className={styles.mainImage}
              />
            ) : (
              <div className={styles.emptyImage}>이미지 없음</div>
            )}

            {imageUrls.length > 1 && (
              <div className={styles.thumbnailList}>
                {imageUrls.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`${styles.thumbnailButton} ${
                      selectedImageIndex === index
                        ? styles.thumbnailButtonActive
                        : ""
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${product.TITLE} 이미지 ${index + 1}`}
                      className={styles.thumbnailImage}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className={styles.summaryArea}>
            <nav className={styles.breadcrumb}>
              <span>홈</span>
              <span>&gt;</span>
              <span>{product.MAIN_CATEGORY}</span>
              <span>&gt;</span>
              <span>{product.SUB_CATEGORY}</span>
            </nav>

            <h1 className={styles.title}>{product.TITLE}</h1>

            <strong className={styles.price}>
              {formatPrice(product.BASE_PRICE)}
            </strong>

            {createdAtText && (
              <p className={styles.createdAt}>{createdAtText}</p>
            )}

            <div className={styles.stats}>
              <span className={styles.statItem}>
                <svg
                  className={styles.statIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 5C6.5 5 2.3 9.1 1 12c1.3 2.9 5.5 7 11 7s9.7-4.1 11-7c-1.3-2.9-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.8a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" />
                </svg>
                {product.VIEW_COUNT ?? 0}
              </span>

              <span className={styles.statItem}>
                <svg
                  className={styles.statIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4.5 4v-4.5A2.5 2.5 0 0 1 4 12.5z" />
                </svg>
                {product.CHAT_COUNT ?? 0}
              </span>

              <span className={styles.statItem}>
                <svg
                  className={styles.statIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 21s-6.716-4.35-9.193-8.077C.91 10.064 1.37 5.97 4.59 4.09c2.02-1.18 4.57-.78 6.41.9l1 0 1-1c1.84-1.68 4.39-2.08 6.41-.9 3.22 1.88 3.68 5.974 1.783 8.833C18.716 16.65 12 21 12 21z" />
                </svg>
                {product.WISH_COUNT ?? 0}
              </span>
            </div>

            <div className={styles.tradeBox}>
              <button
                type="button"
                className={styles.tradeHeader}
                onClick={() => setIsTradeBoxOpen((prev) => !prev)}
              >
                <span className={styles.tradeTitle}>
                  {!hasRegion
                    ? "무료배송"
                    : tradeTypes.length > 0
                      ? tradeTypes.map((type, index) => (
                          <Fragment key={type}>
                            <span>{getTradeLabel(type)}</span>
                            {index < tradeTypes.length - 1 && (
                              <span className={styles.tradeSeparator}>|</span>
                            )}
                          </Fragment>
                        ))
                      : "거래 방식 정보 없음"}
                </span>

                <span className={styles.tradeArrow}>
                  {isTradeBoxOpen ? "▲" : "▼"}
                </span>
              </button>

              {isTradeBoxOpen && (
                <div className={styles.tradeTable}>
                  {tradeTypes.length > 0 ? (
                    tradeTypes.map((type) => (
                      <div key={type} className={styles.tradeRow}>
                        <span>{getTradeLabel(type)}</span>
                        <strong>
                          {type === "DELIVERY"
                            ? "무료배송"
                            : locationText || "거래 지역 미정"}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <div className={styles.tradeRow}>
                      <span>거래 방식</span>
                      <strong>거래 방식 정보 없음</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.statusBox}>
              <span>상품 상태</span>
              <strong>{accessoryStatusText}</strong>
            </div>

            <div className={styles.actionBar}>
              <button type="button" className={styles.wishButton}>
                ♡
              </button>
              <button type="button" className={styles.chatButton}>
                채팅하기
              </button>
              <button
                type="button"
                className={styles.buyButton}
                onClick={handleOpenTradeDrawer}
              >
                구매하기
              </button>
            </div>
          </section>
        </section>

        <section className={styles.bottomSection}>
          <section className={styles.descriptionSection}>
            <h2 className={styles.sectionTitle}>상품 정보</h2>
            <p className={styles.description}>{product.DESCRIPTION}</p>
          </section>

          <aside className={styles.sellerSection}>
            <h2 className={styles.sectionTitle}>판매자 정보</h2>

            <div className={styles.sellerCard}>
              <div className={styles.sellerAvatar}>
                {product.NICKNAME?.slice(0, 1) ?? "?"}
              </div>

              <strong className={styles.sellerName}>
                {product.NICKNAME ?? "판매자 정보 없음"}
              </strong>
            </div>
          </aside>
        </section>
      </main>

      <div className={styles.recentViewedArea}>
        <RecentViewedBox />
      </div>

      <TradeMethodDrawer
        open={tradeDrawerOpen}
        onClose={handleCloseTradeDrawer}
        product={tradePreview}
        initialTradeId={initialTradeId}
        initialPaid={initialPaid}
      />
    </div>
  );
}
