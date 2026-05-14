import ProductTradeBox from "./ProductTradeBox";
import styles from "../pages/ProductDetailPage.module.css";
import {
  formatProductCreatedAt,
  formatProductPrice,
  getAccessoryStatusLabel,
} from "../utils/productFormat";

type ProductSummaryProps = {
  title: string;
  price: number;
  mainCategory?: string;
  subCategory?: string;
  createdAt?: string;
  viewCount?: number;
  chatCount?: number;
  wishCount?: number;
  tradeType?: string;
  state?: string | null;
  city?: string | null;
  accessoryStatus?: string;
  statusCode?: string;
  isWished?: boolean | number;
  onWishlistClick?: () => void;
  onChatClick?: () => void;
  onBuyClick?: () => void;
};

function getProductStatusUi(statusCode?: string) {
  switch (statusCode) {
    case "TRADING":
      return {
        noticeText: "거래 중인 상품입니다.",
        buyButtonText: "거래 중",
        buyButtonDisabled: true,
      };

    case "SOLD":
      return {
        noticeText: "이미 판매된 상품입니다.",
        buyButtonText: "품절",
        buyButtonDisabled: true,
      };

    case "SALE":
    default:
      return {
        noticeText: "",
        buyButtonText: "구매하기",
        buyButtonDisabled: false,
      };
  }
}

export default function ProductSummary({
  title,
  price,
  mainCategory,
  subCategory,
  createdAt,
  viewCount,
  chatCount,
  wishCount,
  tradeType,
  state,
  city,
  accessoryStatus,
  statusCode,
  isWished,
  onWishlistClick,
  onChatClick,
  onBuyClick,
}: ProductSummaryProps) {
  const createdAtText = formatProductCreatedAt(createdAt);
  const accessoryStatusText = getAccessoryStatusLabel(accessoryStatus);
  const wished = isWished === true || isWished === 1;
  const statusUi = getProductStatusUi(statusCode);

  return (
    <section className={styles.summaryArea}>
      <nav className={styles.breadcrumb}>
        <span>홈</span>
        <span>&gt;</span>
        <span>{mainCategory}</span>
        <span>&gt;</span>
        <span>{subCategory}</span>
      </nav>

      <h1 className={styles.title}>{title}</h1>

      <strong className={styles.price}>{formatProductPrice(price)}</strong>

      {createdAtText && <p className={styles.createdAt}>{createdAtText}</p>}

      <div className={styles.stats}>
        <span className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5C6.5 5 2.3 9.1 1 12c1.3 2.9 5.5 7 11 7s9.7-4.1 11-7c-1.3-2.9-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.8a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" />
          </svg>
          {viewCount ?? 0}
        </span>

        <span className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4.5 4v-4.5A2.5 2.5 0 0 1 4 12.5z" />
          </svg>
          {chatCount ?? 0}
        </span>

        <span className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-6.716-4.35-9.193-8.077C.91 10.064 1.37 5.97 4.59 4.09c2.02-1.18 4.57-.78 6.41.9l1 0 1-1c1.84-1.68 4.39-2.08 6.41-.9 3.22 1.88 3.68 5.974 1.783 8.833C18.716 16.65 12 21 12 21z" />
          </svg>
          {wishCount ?? 0}
        </span>
      </div>

      <ProductTradeBox tradeType={tradeType} state={state} city={city} />

      <div className={styles.statusBox}>
        <span>상품 상태</span>
        <strong>{accessoryStatusText}</strong>
      </div>

      {statusUi.noticeText && (
        <p className={styles.productStatusNotice}>{statusUi.noticeText}</p>
      )}

      <div className={styles.actionBar}>
        <button
          type="button"
          className={`${styles.wishButton} ${
            wished ? styles.wishButtonActive : ""
          }`}
          onClick={onWishlistClick}
          aria-pressed={wished}
        >
          {wished ? "♥" : "♡"}
        </button>

        <button
          type="button"
          className={styles.chatButton}
          onClick={onChatClick}
        >
          채팅하기
        </button>

        <button
          type="button"
          className={styles.buyButton}
          onClick={onBuyClick}
          disabled={statusUi.buyButtonDisabled}
        >
          {statusUi.buyButtonText}
        </button>
      </div>
    </section>
  );
}