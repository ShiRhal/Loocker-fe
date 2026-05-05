import styles from "./RecentViewedBox.module.css";

/*
  홈 화면 우측에 표시되는 최근본상품 박스 컴포넌트입니다.
  현재 단계에서는 데이터 연결 전이므로
  empty 상태와 기본 리스트 구조만 먼저 구성합니다.
*/

/* 최근본상품 1개에 필요한 최소 데이터 구조 */
type RecentViewedItem = {
  id: number;
  title: string;
  imageUrl?: string;
};

/* 컴포넌트에 전달할 props 구조 */
type RecentViewedBoxProps = {
  items?: RecentViewedItem[];
};

export default function RecentViewedBox({
  items = [],
}: RecentViewedBoxProps) {
  /* 전달된 상품이 없으면 empty 상태를 보여주기 위한 값 */
  const isEmpty = items.length === 0;

  return (
    <aside className={styles.box} aria-label="최근본상품">
      <h2 className={styles.title}>최근본상품</h2>

      {isEmpty ? (
        /* 데이터가 아직 없을 때 보여줄 기본 상태 */
        <div className={styles.emptyBox}>
          <p className={styles.emptyText}>최근 본 상품이 없습니다.</p>
        </div>
      ) : (
        /* 나중에 mock 데이터나 API 데이터를 연결하면 이 영역에 목록이 렌더링됨 */
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <button type="button" className={styles.cardButton}>
                {item.imageUrl ? (
                  /* 대표 이미지가 있으면 이미지 표시 */
                  <img src={item.imageUrl} alt={item.title} className={styles.thumb} />
                ) : (
                  /* 대표 이미지가 없을 때 대체 영역 표시 */
                  <div className={styles.thumbPlaceholder}>No image</div>
                )}

                {/* 상품명 표시 */}
                <span className={styles.itemTitle}>{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}