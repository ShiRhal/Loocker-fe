import styles from "./ProductSortBar.module.css";

/*
  상품 목록 정렬바 컴포넌트입니다.
  현재 단계에서는 선택 상태만 정적으로 표시합니다.
*/

export default function ProductSortBar() {
  return (
    <div className={styles.bar} aria-label="상품 정렬">
      <button type="button" className={`${styles.sortButton} ${styles.active}`}>
        추천순
      </button>
      <span className={styles.divider}>|</span>

      <button type="button" className={styles.sortButton}>
        최신순
      </button>
      <span className={styles.divider}>|</span>

      <button type="button" className={styles.sortButton}>
        낮은가격순
      </button>
      <span className={styles.divider}>|</span>

      <button type="button" className={styles.sortButton}>
        높은가격순
      </button>
    </div>
  );
}