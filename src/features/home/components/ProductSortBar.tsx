import styles from "./ProductSortBar.module.css";
import type { SortType } from "../types/home.types";

type ProductSortBarProps = {
  value: SortType;
  onChange: (next: SortType) => void;
};

export default function ProductSortBar({
  value,
  onChange,
}: ProductSortBarProps) {
  return (
    <div className={styles.bar} aria-label="상품 정렬">
      <button
        type="button"
        className={`${styles.sortButton} ${
          value === "latest" ? styles.active : ""
        }`}
        onClick={() => onChange("latest")}
      >
        최신순
      </button>
      <span className={styles.divider}>|</span>

      <button
        type="button"
        className={`${styles.sortButton} ${
          value === "recommended" ? styles.active : ""
        }`}
        onClick={() => onChange("recommended")}
      >
        추천순
      </button>
      <span className={styles.divider}>|</span>

      <button
        type="button"
        className={`${styles.sortButton} ${
          value === "priceAsc" ? styles.active : ""
        }`}
        onClick={() => onChange("priceAsc")}
      >
        낮은가격순
      </button>
      <span className={styles.divider}>|</span>

      <button
        type="button"
        className={`${styles.sortButton} ${
          value === "priceDesc" ? styles.active : ""
        }`}
        onClick={() => onChange("priceDesc")}
      >
        높은가격순
      </button>
    </div>
  );
}