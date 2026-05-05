import styles from "./PriceStatsBox.module.css";
import type { PriceStats } from "../types/home.types";

type PriceStatsBoxProps = {
  stats: PriceStats;
};

function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function PriceStatsBox({ stats }: PriceStatsBoxProps) {
  return (
    <section className={styles.wrapper} aria-label="가격 통계">
      <div className={styles.header}>
        <span className={styles.icon}>⌕</span>
        <h3 className={styles.title}>검색 상품 가격 요약</h3>
      </div>

      <div className={styles.section}>
        <div className={styles.item}>
          <p className={styles.label}>평균 가격</p>
          <strong className={styles.value}>{formatPrice(stats.avgPrice)}</strong>
        </div>

        <div className={styles.item}>
          <p className={styles.label}>가장 높은 가격</p>
          <strong className={styles.value}>{formatPrice(stats.maxPrice)}</strong>
        </div>

        <div className={styles.item}>
          <p className={styles.label}>가장 낮은 가격</p>
          <strong className={styles.value}>{formatPrice(stats.minPrice)}</strong>
        </div>
      </div>
    </section>
  );
}