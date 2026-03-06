import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/auth/useAuth";
import styles from "./NavBar.module.css";

type NavBarProps = {
  showRecent?: boolean;
};

export default function NavBar({ showRecent = true }: NavBarProps) {
  const { me } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const goIfAuthedOrSignin = (to: string) => {
    if (me) {
      nav(to);
      return;
    }
    const redirect = encodeURIComponent(loc.pathname + loc.search);
    nav(`/signin?redirect=${redirect}`);
  };

  return (
    <header id="siteHeader" className={styles.header}>
      <div className={styles.innerSticky}>
        <div className={styles.topRow}>
          {/* Left: Logo */}
          <div className={styles.logoWrap}>
            <button className={styles.logoLink} onClick={() => nav("/")}>
              <span className={styles.logoPlaceholder}>LOGO</span>
            </button>
          </div>

          {/* Center: Search */}
          <div className={styles.searchWrap}>
            <form className={styles.searchForm} role="search" noValidate>
              <span className={styles.searchIcon} aria-hidden="true">
                🔎
              </span>
              <input
                id="search-box"
                className={styles.searchInput}
                placeholder="어떤 상품을 찾으시나요?"
                autoComplete="off"
                name="search"
              />
            </form>

            <div className={styles.keywordRow} aria-label="추천 검색어">
              <button className={styles.keywordNavBtn} aria-label="이전">
                ◀
              </button>
              <button className={styles.keywordNavBtn} aria-label="다음">
                ▶
              </button>

              <ul className={styles.keywordList}>
                <li>
                  <a href="/search/레고">1. 레고</a>
                </li>
                <li>
                  <a href="/search/ps5">2. ps5</a>
                </li>
                <li>
                  <a href="/search/노트북">3. 노트북</a>
                </li>
                <li>
                  <a href="/search/라이카">4. 라이카</a>
                </li>
                <li>
                  <a href="/search/실버바">5. 실버바</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Actions */}
          <div className={styles.actionWrap}>
            <button
              className={styles.actionBtn}
              type="button"
              onClick={() => goIfAuthedOrSignin("/chat")}
            >
              💬 <span className={styles.badge}>0</span>
              <span>채팅하기</span>
            </button>

            <button
              className={styles.actionLink}
              type="button"
              onClick={() => goIfAuthedOrSignin("/product/form?type=regist")}
            >
              🛍️ <span>판매하기</span>
            </button>

            <button
              className={styles.actionBtn}
              type="button"
              onClick={() => goIfAuthedOrSignin("/mypage")}
            >
              👤 <span>마이</span>
            </button>

            {showRecent && (
              <aside className={styles.recentAside} aria-label="최근본상품">
                <h2 className={styles.recentTitle}>최근본상품</h2>
                <ul className={styles.recentList}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className={styles.recentItem}>
                      <a className={styles.recentThumb} href="#recent">
                        <span className={styles.thumbPlaceholder} />
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
