import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/auth/useAuth";
import { searchApi } from "../../api/searchApi";
import SearchDrawer from "./SearchDrawer";
import styles from "./NavBar.module.css";
import loockerLogo from "../../../assets/images/Loocker.png";
import loockerLogoMobile from "../../../assets/images/Loocker_m.png";
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

type NavBarProps = {
  onOpenChat?: () => void;
};

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.8 10.6 12 3.8l8.2 6.8v8.6a1 1 0 0 1-1 1h-4.6v-5.8H9.4v5.8H4.8a1 1 0 0 1-1-1v-8.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const fallbackPopularKeywords: PopularKeyword[] = [
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

export default function NavBar({ onOpenChat }: NavBarProps) {
  const { me } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [searchParams] = useSearchParams();

  const [pageIndex, setPageIndex] = useState(0);
  const [popularKeywords, setPopularKeywords] = useState<PopularKeyword[]>(
    fallbackPopularKeywords,
  );
  const [searchKeyword, setSearchKeyword] = useState(
    searchParams.get("keyword") ?? "",
  );
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);

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
    setSearchKeyword(searchParams.get("keyword") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const fetchPopularKeywords = async () => {
      try {
        const data = await searchApi.getPopularKeywords();

        //console.log("[NavBar] 인기 검색어 API 응답:", data);

        const mappedKeywords = data
          .filter((item) => item.KEYWORD && item.KEYWORD.trim().length > 0)
          .map((item, index) => ({
            rank: index + 1,
            keyword: item.KEYWORD.trim(),
          }));

        if (mappedKeywords.length > 0) {
          setPopularKeywords(mappedKeywords);
          setPageIndex(0);
        }
      } catch (error) {
        console.error("[NavBar] 인기 검색어 API 호출 실패:", error);
      }
    };

    fetchPopularKeywords();
  }, []);

  useEffect(() => {
    if (keywordPages.length <= 1) return;

    const timer = window.setInterval(() => {
      setPageIndex((prev) => (prev + 1) % keywordPages.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [keywordPages.length]);

  const handlePrevKeywords = () => {
    if (!keywordPages.length) return;

    setPageIndex(
      (prev) => (prev - 1 + keywordPages.length) % keywordPages.length,
    );
  };

  const handleNextKeywords = () => {
    if (!keywordPages.length) return;

    setPageIndex((prev) => (prev + 1) % keywordPages.length);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedKeyword = searchKeyword.trim();

    if (!trimmedKeyword) {
      nav("/");
      setSearchDrawerOpen(false);
      return;
    }

    nav(`/?keyword=${encodeURIComponent(trimmedKeyword)}`);
    setSearchDrawerOpen(false);
  };

  const handlePopularKeywordClick = (keyword: string) => {
    nav(`/?keyword=${encodeURIComponent(keyword)}`);
    setSearchDrawerOpen(false);
  };

  const goIfAuthedOrSignin = (to: string) => {
    if (me) {
      nav(to);
      return;
    }

    const redirect = encodeURIComponent(loc.pathname + loc.search);
    nav(`/signin?redirect=${redirect}`);
  };

  const openChatDrawerOrSignin = () => {
    if (me) {
      onOpenChat?.();
      return;
    }

    const redirect = encodeURIComponent(loc.pathname + loc.search);
    nav(`/signin?redirect=${redirect}`);
  };

  const isFooterActive = (path: string) => {
    if (path === "/") return loc.pathname === "/";
    return loc.pathname.startsWith(path);
  };

  return (
    <header id="siteHeader" className={styles.header}>
      <div className={styles.innerSticky}>
        <div className={styles.topRow}>
          <div className={styles.logoWrap}>
            <button className={styles.logoLink} onClick={() => nav("/")}>
              <picture>
                <source media="(max-width: 1000px)" srcSet={loockerLogoMobile} />
                <img
                  src={loockerLogo}
                  alt="Loocker"
                  className={styles.logoImage}
                />
              </picture>
            </button>
          </div>

          <button
            type="button"
            className={styles.mobileSearchButton}
            onClick={() => setSearchDrawerOpen(true)}
            aria-label="검색 열기"
          >
            <img src={searchIcon} alt="" className={styles.mobileSearchIcon} />
          </button>

          <div className={styles.searchWrap}>
            <form
              className={styles.searchForm}
              role="search"
              noValidate
              onSubmit={handleSearchSubmit}
            >
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
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
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
                  <img
                    src={rightIcon}
                    alt="다음"
                    className={styles.rightIcon}
                  />
                </button>

                <ul className={styles.keywordList}>
                  {currentKeywords.map((item) => (
                    <li key={item.rank} className={styles.keywordItem}>
                      <button
                        type="button"
                        className={styles.keywordLink}
                        onClick={() => handlePopularKeywordClick(item.keyword)}
                      >
                        <span className={styles.keywordRank}>
                          {item.rank}.{" "}
                        </span>
                        <span className={styles.keywordText}>
                          {item.keyword}
                        </span>
                      </button>
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
              onClick={openChatDrawerOrSignin}
            >
              <img src={chatIcon} alt="채팅" className={styles.chatIcon} />
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

      <nav className={styles.mobileFooterNav} aria-label="모바일 하단 메뉴">
        <button
          type="button"
          className={`${styles.mobileFooterItem} ${
            isFooterActive("/") ? styles.mobileFooterItemActive : ""
          }`}
          onClick={() => nav("/")}
        >
          <HomeIcon className={styles.mobileFooterIcon} />
          <span>홈</span>
        </button>

        <button
          type="button"
          className={`${styles.mobileFooterItem} ${
            isFooterActive("/product/form") ? styles.mobileFooterItemActive : ""
          }`}
          onClick={() => goIfAuthedOrSignin("/product/form?type=regist")}
        >
          <img src={saleIcon} alt="" className={styles.mobileFooterIcon} />
          <span>등록</span>
        </button>

        <button
          type="button"
          className={styles.mobileFooterItem}
          onClick={openChatDrawerOrSignin}
        >
          <img src={chatIcon} alt="" className={styles.mobileFooterIcon} />
          <span>채팅</span>
        </button>

        <button
          type="button"
          className={`${styles.mobileFooterItem} ${
            isFooterActive("/mypage") ? styles.mobileFooterItemActive : ""
          }`}
          onClick={() => goIfAuthedOrSignin("/mypage")}
        >
          <img src={userIcon} alt="" className={styles.mobileFooterIcon} />
          <span>마이</span>
        </button>
      </nav>

      <SearchDrawer
        open={searchDrawerOpen}
        searchKeyword={searchKeyword}
        popularKeywords={popularKeywords}
        onClose={() => setSearchDrawerOpen(false)}
        onSearchKeywordChange={setSearchKeyword}
        onSearchSubmit={handleSearchSubmit}
        onPopularKeywordClick={handlePopularKeywordClick}
      />
    </header>
  );
}
