import type { ProductItem } from "../types/home.types";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  product: ProductItem;
};

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasImage = Boolean(product.imageUrl);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        {product.isLockerTrade && (
          <span className={styles.badge}>보관함 거래</span>
        )}

        <button type="button" className={styles.imageButton}>
          {hasImage ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className={styles.image}
            />
          ) : (
            <div className={styles.imageFallback}>이미지 없음</div>
          )}
        </button>

        <button type="button" className={styles.likeButton} aria-label="찜하기">
          ♡
        </button>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{product.title}</h3>

        <strong className={styles.price}>{formatPrice(product.price)}</strong>

        <div className={styles.infoRow}>
          <span className={styles.infoItem}>
            <svg
              className={styles.metaIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 21s-6.716-4.35-9.193-8.077C.91 10.064 1.37 5.97 4.59 4.09c2.02-1.18 4.57-.78 6.41.9l1 0 1-1c1.84-1.68 4.39-2.08 6.41-.9 3.22 1.88 3.68 5.974 1.783 8.833C18.716 16.65 12 21 12 21z" />
            </svg>
            <span>{product.likeCount}</span>
          </span>

          <span className={styles.infoItem}>
            <svg
              className={styles.metaIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4.5 4v-4.5A2.5 2.5 0 0 1 4 12.5z" />
            </svg>
            <span>{product.chatCount}</span>
          </span>

          <span className={styles.divider}>|</span>

          <span className={styles.createdText}>{product.createdText}</span>
        </div>

        <p className={styles.location}>{product.location}</p>
      </div>
    </article>
  );
}