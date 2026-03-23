import styles from "./RecentViewedSidebar.module.css";

/*
  홈 화면 우측 최근본상품 사이드바 컴포넌트
  현재 단계에서는 empty 상태와 기본 리스트 구조만 먼저 만듭니다.
*/

type RecentViewedItem = {
  id: number;
  title: string;
  imageUrl?: string;
};

type RecentViewedSidebarProps = {
  items?: RecentViewedItem[];
};

export default function RecentViewedSidebar({
  items = [],
}: RecentViewedSidebarProps) {
  const isEmpty = items.length === 0;

  return (
    <aside className={styles.sidebar} aria-label="최근본상품">
      <h2 className={styles.title}>최근본상품</h2>

      {isEmpty ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyText}>최근 본 상품이 없습니다.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <button type="button" className={styles.cardButton}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className={styles.thumb} />
                ) : (
                  <div className={styles.thumbPlaceholder}>No image</div>
                )}
                <span className={styles.itemTitle}>{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}