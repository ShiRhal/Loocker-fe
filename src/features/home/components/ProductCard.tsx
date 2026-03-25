import type { ProductItem } from "../types/home.types";
import styles from "./ProductCard.module.css";

/*
  홈 화면 상품 카드 컴포넌트입니다.
  이미지 1:1, 제목 2줄, 가격, 지역과 시간, 찜수와 채팅수를 표시합니다.
*/

type ProductCardProps = {
  product: ProductItem;
};

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        {product.isLockerTrade && (
          <span className={styles.badge}>보관함 거래</span>
        )}

        <button type="button" className={styles.imageButton}>
          <img
            src={product.imageUrl}
            alt={product.title}
            className={styles.image}
          />
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