import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/auth/useAuth";
import styles from "./NavBar.module.css";
import loockerLogo from "../../../assets/images/Loocker.png";
import chatIcon from "../../../assets/icons/chat.svg";
import saleIcon from "../../../assets/icons/sale.svg";
import searchIcon from "../../../assets/icons/search.svg";
import userIcon from "../../../assets/icons/user.svg";
import leftIcon from "../../../assets/icons/left.svg";
import rightIcon from "../../../assets/icons/right.svg";
import "../../styles/global.css";

type PopularKeyword = {
  rank: number;
  keyword: string;
};

export default function NavBar() {
  const { me } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [pageIndex, setPageIndex] = useState(0);

  const popularKeywords: PopularKeyword[] = [
    { rank: 1, keyword: "레고" },
    { rank: 2, keyword: "ps5" },
    { rank: 3, keyword: "노트북" },
    { rank: 4, keyword: "라이카" },
    { rank: 5, keyword: "실버바" },
    { rank: 6, keyword: "줌바" },
    { rank: 7, keyword: "메가커피" },
    { rank: 8, keyword: "5070" },
    { rank: 9, keyword: "타임" },
    { rank: 10, keyword: "스타벅스" },
    { rank: 11, keyword: "레고 커스텀" },
    { rank: 12, keyword: "s25" },
    { rank: 13, keyword: "5090" },
    { rank: 14, keyword: "갤럭시탭" },
    { rank: 15, keyword: "레고 스타워즈" },
    { rank: 16, keyword: "핫토이" },
    { rank: 17, keyword: "건담" },
    { rank: 18, keyword: "아이패드" },
    { rank: 19, keyword: "메가박스" },
    { rank: 20, keyword: "폴드7" },
  ];

  const keywordPages = useMemo(() => {
    const pageSize = 5;
    const pages: PopularKeyword[][] = [];
    for (let i = 0; i < popularKeywords.length; i += pageSize) {
      pages.push(popularKeywords.slice(i, i + pageSize));
    }
    return pages;
  }, [popularKeywords]);

  const hasKeywords = keywordPages.length > 0;
  const currentKeywords = hasKeywords ? keywordPages[pageIndex] : [];

  useEffect(() => {
    if (keywordPages.length <= 1) return;

    const timer = window.setInterval(() => {
      setPageIndex((prev) => (prev + 1) % keywordPages.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [keywordPages.length]);

  const handlePrevKeywords = () => {
    if (!keywordPages.length) return;
    setPageIndex((prev) => (prev - 1 + keywordPages.length) % keywordPages.length);
  };

  const handleNextKeywords = () => {
    if (!keywordPages.length) return;
    setPageIndex((prev) => (prev + 1) % keywordPages.length);
  };

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
          <div className={styles.logoWrap}>
            <button className={styles.logoLink} onClick={() => nav("/")}>
              <img
                src={loockerLogo}
                alt="Loocker"
                className={styles.logoImage}
              />
            </button>
          </div>

          <div className={styles.searchWrap}>
            <form className={styles.searchForm} role="search" noValidate>
              <span className={styles.searchIcon} aria-hidden="true">
                <img
                  src={searchIcon}
                  alt="검색"
                  className={styles.searchIcon}
                />
              </span>
              <input
                id="search-box"
                className={styles.searchInput}
                placeholder="어떤 상품을 찾으시나요?"
                autoComplete="off"
                name="search"
              />
            </form>

            {hasKeywords && (
              <div className={styles.keywordRow} aria-label="인기 검색어">
                <button
                  className={styles.keywordNavBtn}
                  aria-label="이전 인기 검색어"
                  type="button"
                  onClick={handlePrevKeywords}
                >
                  <img src={leftIcon} alt="이전" className={styles.leftIcon} />
                </button>

                <button
                  className={styles.keywordNavBtn}
                  aria-label="다음 인기 검색어"
                  type="button"
                  onClick={handleNextKeywords}
                >
                  <img src={rightIcon} alt="다음" className={styles.rightIcon} />
                </button>

                <ul className={styles.keywordList}>
                  {currentKeywords.map((item) => (
                    <li key={item.rank} className={styles.keywordItem}>
                      <a
                        href={`/search/${encodeURIComponent(item.keyword)}`}
                        className={styles.keywordLink}
                      >
                        <span className={styles.keywordRank}>{item.rank}. </span>
                        <span className={styles.keywordText}>{item.keyword}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.actionWrap}>
            <button
              className={styles.actionBtn}
              type="button"
              onClick={() => goIfAuthedOrSignin("/chat")}
            >
              <img src={chatIcon} alt="채팅" className={styles.chatIcon} />
              <span className={styles.badge}>0</span>
              <span className={styles.OptionText}>채팅하기</span>
            </button>

            <button
              className={styles.actionLink}
              type="button"
              onClick={() => goIfAuthedOrSignin("/product/form?type=regist")}
            >
              <img src={saleIcon} alt="판매하기" className={styles.saleIcon} />
              <span className={styles.OptionText}>판매하기</span>
            </button>

            <button
              className={styles.actionBtn}
              type="button"
              onClick={() => goIfAuthedOrSignin("/mypage")}
            >
              <img src={userIcon} alt="마이" className={styles.userIcon} />
              <span className={styles.OptionText}>마이</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}