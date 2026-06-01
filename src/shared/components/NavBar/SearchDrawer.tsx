import type { FormEvent } from "react";
import { Drawer } from "antd";
import DrawerLayout from "../DrawerLayout/DrawerLayout";
import searchIcon from "../../../assets/icons/search.svg";
import styles from "./NavBar.module.css";

type PopularKeyword = {
  rank: number;
  keyword: string;
};

type SearchDrawerProps = {
  open: boolean;
  searchKeyword: string;
  popularKeywords: PopularKeyword[];
  onClose: () => void;
  onSearchKeywordChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPopularKeywordClick: (keyword: string) => void;
};

export default function SearchDrawer({
  open,
  searchKeyword,
  popularKeywords,
  onClose,
  onSearchKeywordChange,
  onSearchSubmit,
  onPopularKeywordClick,
}: SearchDrawerProps) {
  const hasKeywords = popularKeywords.length > 0;

  return (
    <Drawer
      placement="right"
      onClose={onClose}
      open={open}
      closable={false}
      width={640}
      styles={{
        body: {
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        },
        header: { display: "none" },
      }}
      destroyOnClose
    >
      <DrawerLayout title="검색" onBack={onClose} mainClassName={styles.searchDrawerMain}>
        <div className={styles.searchDrawerInner}>
          <form
            className={`${styles.searchForm} ${styles.mobileSearchForm}`}
            role="search"
            noValidate
            onSubmit={onSearchSubmit}
          >
            <span className={styles.searchIcon} aria-hidden="true">
              <img src={searchIcon} alt="" className={styles.searchIcon} />
            </span>

            <input
              id="mobile-search-box"
              className={styles.searchInput}
              placeholder="어떤 상품을 찾으시나요?"
              autoComplete="off"
              name="search"
              value={searchKeyword}
              onChange={(e) => onSearchKeywordChange(e.target.value)}
              autoFocus
            />
          </form>

          {hasKeywords && (
            <div className={styles.searchDrawerKeywords}>
              <div className={styles.searchDrawerKeywordTitle}>인기 검색어</div>
              <ul className={styles.searchDrawerKeywordList}>
                {popularKeywords.slice(0, 10).map((item) => (
                  <li key={item.rank}>
                    <button
                      type="button"
                      className={styles.searchDrawerKeywordButton}
                      onClick={() => onPopularKeywordClick(item.keyword)}
                    >
                      <span>{item.rank}.</span>
                      <strong>{item.keyword}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DrawerLayout>
    </Drawer>
  );
}
