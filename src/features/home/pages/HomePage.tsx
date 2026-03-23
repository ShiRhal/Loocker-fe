import RecentViewedBox from "../components/RecentViewedBox";
import styles from "./HomePage.module.css";

/*
  홈 화면의 기본 골격 페이지입니다.
  현재 단계에서는
  좌측 본문 영역과 우측 최근본상품 박스의 2열 구조만 먼저 구성합니다.
*/

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* 앞으로 검색결과 박스, 가격 요약, 정렬바, 상품 카드 그리드가 들어갈 본문 영역 */}
      <section className={styles.content}>
        <div className={styles.placeholder}>
          Home content area
        </div>
      </section>

      {/* 우측 최근본상품 박스 */}
      <RecentViewedBox items={[]} />
    </div>
  );
}