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

        <p className={styles.meta}>
          {product.location} · {product.createdText}
        </p>

        <p className={styles.counts}>
          찜 {product.likeCount} · 채팅 {product.chatCount}
        </p>
      </div>
    </article>
  );
}