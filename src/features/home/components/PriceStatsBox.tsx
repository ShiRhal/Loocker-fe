import styles from "./PriceStatsBox.module.css";

/*
  현재 페이지 기준 가격 통계 박스입니다.
  참고 이미지처럼 하나의 요약 박스 안에 3개 통계를 나누어 배치합니다.
*/

export default function PriceStatsBox() {
  return (
    <section className={styles.wrapper} aria-label="가격 통계">
      <div className={styles.header}>
        <span className={styles.icon}>⌕</span>
        <h3 className={styles.title}>검색 상품 가격 요약</h3>
      </div>

      <div className={styles.section}>
        <div className={styles.item}>
          <p className={styles.label}>평균 가격</p>
          <strong className={styles.value}>155,554원</strong>
        </div>

        <div className={styles.item}>
          <p className={styles.label}>가장 높은 가격</p>
          <strong className={styles.value}>800,000원</strong>
        </div>

        <div className={styles.item}>
          <p className={styles.label}>가장 낮은 가격</p>
          <strong className={styles.value}>5,000원</strong>
        </div>
      </div>
    </section>
  );
}