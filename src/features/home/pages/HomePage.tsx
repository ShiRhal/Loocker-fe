import RecentViewedBox from "../components/RecentViewedBox";
import SearchFilterBox from "../components/SearchFilterBox";
import PriceStatsBox from "../components/PriceStatsBox";
import ProductSortBar from "../components/ProductSortBar";
import ProductGrid from "../components/ProductGrid";
import { mockProducts } from "../mock/homeProducts";
import styles from "./HomePage.module.css";

/*
  홈 화면의 기본 골격 페이지입니다.
  현재 단계에서는
  검색 필터 박스, 가격 통계 영역, 정렬바, 상품 카드 그리드, 우측 최근본상품 박스를 배치합니다.
*/

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <SearchFilterBox />
        <PriceStatsBox />

        {/* 상품 정렬 영역 */}
        <ProductSortBar />

        {/* 상품 카드 그리드 */}
        <ProductGrid products={mockProducts} />
      </section>

      <RecentViewedBox items={[]} />
    </div>
  );
}