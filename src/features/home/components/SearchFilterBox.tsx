import styles from "./SearchFilterBox.module.css";

/*
  홈 화면 상단 검색 필터 박스입니다.
  현재 단계에서는 필터 동작 없이 정적인 레이아웃만 먼저 구성합니다.
*/

export default function SearchFilterBox() {
  return (
    <section className={styles.wrapper} aria-label="검색 결과 필터">
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>
            <span className={styles.keyword}>'123'</span> 검색결과
          </h2>
          <span className={styles.count}>총 322개</span>
        </div>
      </div>

      <div className={styles.topLine} />

      <div className={styles.filterTable}>
        {/* 카테고리 선택 상태 표시 영역 */}
        <div className={styles.row}>
          <div className={styles.label}>
            <span>카테고리</span>
            <span className={styles.plus}>＋</span>
          </div>
          <div className={styles.value}>전체</div>
        </div>

        {/* 가격 범위 표시 영역 */}
        <div className={styles.row}>
          <div className={styles.label}>가격</div>
          <div className={styles.value}>
            <div className={styles.priceRow}>
              <input
                className={styles.priceInput}
                type="text"
                placeholder="최소 가격"
                readOnly
              />
              <span className={styles.rangeMark}>~</span>
              <input
                className={styles.priceInput}
                type="text"
                placeholder="최대 가격"
                readOnly
              />
              <button type="button" className={styles.applyButton}>
                적용
              </button>
            </div>
          </div>
        </div>

        {/* 옵션 선택 상태 표시 영역 */}
        <div className={styles.row}>
          <div className={styles.label}>옵션</div>
          <div className={styles.value}>
            <div className={styles.optionRow}>
              <span className={styles.optionItem}>보관함 거래 가능</span>
              <span className={`${styles.optionItem} ${styles.optionItemActive}`}>
                판매완료 상품 제외
              </span>
            </div>
          </div>
        </div>

        {/* 현재 적용된 필터 표시 영역 */}
        <div className={styles.row}>
          <div className={styles.label}>선택한 필터</div>
          <div className={styles.value}>
            <div className={styles.selectedRow}>
              <div className={styles.selectedFilters}>
                <span className={styles.selectedItem}>전체 ×</span>
                <span className={styles.selectedItem}>판매완료 상품 제외 ×</span>
              </div>

              <button type="button" className={styles.resetButton}>
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}