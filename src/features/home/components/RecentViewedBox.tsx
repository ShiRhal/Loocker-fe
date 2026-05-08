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
  };

  return (
    <aside className={styles.box}>
      <h2 className={styles.title}>최근 본 상품</h2>

      {items.length === 0 ? (
        <p className={styles.emptyText}>최근 본 상품이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <button
                type="button"
                className={styles.productButton}
                onClick={() => handleItemClick(item.id)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className={styles.image}
                />

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
          ))}
        </ul>
      )}
    </aside>
  );
}