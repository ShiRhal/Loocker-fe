import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRecentViewedProducts,
  removeRecentViewedProduct,
  type RecentViewedItem,
} from "../../../shared/utils/recentViewedStorage";
import styles from "./RecentViewedBox.module.css";

function formatPrice(price: number) {
  return `${price.toLocaleString()}원`;
}

export default function RecentViewedBox() {
  const navigate = useNavigate();

  const [items, setItems] = useState<RecentViewedItem[]>([]);
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(
    () => new Set(),
  );

  const loadRecentViewedProducts = () => {
    setItems(getRecentViewedProducts());
  };

  useEffect(() => {
    loadRecentViewedProducts();

    window.addEventListener(
      "recentViewedProductsChanged",
      loadRecentViewedProducts,
    );

    return () => {
      window.removeEventListener(
        "recentViewedProductsChanged",
        loadRecentViewedProducts,
      );
    };
  }, []);

  const handleItemClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const handleRemoveClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    productId: number,
  ) => {
    event.stopPropagation();
    removeRecentViewedProduct(productId);

    setFailedImageIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const handleImageError = (productId: number) => {
    setFailedImageIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  };

  return (
    <aside className={styles.box}>
      <h2 className={styles.title}>최근 본 상품</h2>

      {items.length === 0 ? (
        <p className={styles.emptyText}>최근 본 상품이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => {
            const hasValidImage =
              item.imageUrl.trim().length > 0 && !failedImageIds.has(item.id);

            return (
              <li key={item.id} className={styles.item}>
                <button
                  type="button"
                  className={styles.productButton}
                  onClick={() => handleItemClick(item.id)}
                >
                  {hasValidImage ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className={styles.image}
                      onError={() => handleImageError(item.id)}
                    />
                  ) : (
                    <div className={styles.emptyImage}>
                      <span className={styles.emptyImageIcon}>⌁</span>
                      <span>이미지 없음</span>
                    </div>
                  )}

                  {item.isSold && (
                    <div className={styles.soldOverlay}>
                      <span className={styles.soldLabel}>판매완료</span>
                    </div>
                  )}

                  <div className={styles.overlay}>
                    <p className={styles.productTitle}>{item.title}</p>
                    <strong className={styles.price}>
                      {formatPrice(item.price)}
                    </strong>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={(event) => handleRemoveClick(event, item.id)}
                  aria-label={`${item.title} 최근 본 상품에서 삭제`}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}