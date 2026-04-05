import { useMemo, useState } from "react";
import styles from "./SearchFilterBox.module.css";
import type { SearchFilterValue } from "../types/home.types";
import {
  MAIN_CATEGORIES,
  SUB_CATEGORIES,
} from "../../../shared/constants/category";

type SearchFilterBoxProps = {
  value: SearchFilterValue;
  onChange: (next: SearchFilterValue) => void;
  onSearch: () => void;
  onReset: () => void;
  onImmediateApply: (next: SearchFilterValue) => void;
};

export default function SearchFilterBox({
  value,
  onChange,
  onSearch,
  onReset,
  onImmediateApply,
}: SearchFilterBoxProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedMainId, setSelectedMainId] = useState<number | null>(null);

  const filteredSubCategories = useMemo(() => {
    if (selectedMainId === null) return [];
    return SUB_CATEGORIES.filter((sub) => sub.parent_id === selectedMainId);
  }, [selectedMainId]);

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNumber = e.target.value.replace(/[^0-9]/g, "");
    onChange({
      ...value,
      minPrice: onlyNumber,
    });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNumber = e.target.value.replace(/[^0-9]/g, "");
    onChange({
      ...value,
      maxPrice: onlyNumber,
    });
  };

  const toggleLocker = () => {
    const next = {
      ...value,
      isLocker: !value.isLocker,
    };
    onImmediateApply(next);
  };

  const toggleExcludeSold = () => {
    const next = {
      ...value,
      excludeSold: !value.excludeSold,
    };
    onImmediateApply(next);
  };

  const clearMainCategory = () => {
    const next = {
      ...value,
      mainCategory: "",
      subCategory: "",
    };
    setSelectedMainId(null);
    onImmediateApply(next);
  };

  const clearExcludeSold = () => {
    const next = {
      ...value,
      excludeSold: false,
    };
    onImmediateApply(next);
  };

  const clearLocker = () => {
    const next = {
      ...value,
      isLocker: false,
    };
    onImmediateApply(next);
  };

  const handleCategoryOpen = () => {
    setIsCategoryOpen((prev) => !prev);
  };

  const handleSelectMainCategory = (mainId: number, mainName: string) => {
    setSelectedMainId(mainId);

    const next = {
      ...value,
      mainCategory: mainName,
      subCategory: "",
    };

    onImmediateApply(next);
  };

  const handleSelectSubCategory = (subName: string) => {
    const next = {
      ...value,
      subCategory: subName,
    };

    onImmediateApply(next);
  };

  const handleBreadcrumbAll = () => {
    setSelectedMainId(null);
    onImmediateApply({
      ...value,
      mainCategory: "",
      subCategory: "",
    });
  };

  const handleBreadcrumbMain = () => {
    if (!value.mainCategory) return;

    const main = MAIN_CATEGORIES.find(
      (item) => item.m_category_name === value.mainCategory
    );

    setSelectedMainId(main ? main.m_category_id : null);

    onImmediateApply({
      ...value,
      subCategory: "",
    });
  };

  const handleBreadcrumbSub = () => {
    if (!value.mainCategory) return;

    const main = MAIN_CATEGORIES.find(
      (item) => item.m_category_name === value.mainCategory
    );

    setSelectedMainId(main ? main.m_category_id : null);
    setIsCategoryOpen(true);
  };

  const renderCategoryPanelItems = () => {
    if (selectedMainId === null) {
      return MAIN_CATEGORIES.map((main) => (
        <button
          key={main.m_category_id}
          type="button"
          className={`${styles.categoryButton} ${
            value.mainCategory === main.m_category_name && !value.subCategory
              ? styles.optionItemActive
              : ""
          }`}
          onClick={() =>
            handleSelectMainCategory(main.m_category_id, main.m_category_name)
          }
        >
          {main.m_category_name}
        </button>
      ));
    }

    return filteredSubCategories.map((sub) => (
      <button
        key={sub.s_category_id}
        type="button"
        className={`${styles.categoryButton} ${
          value.subCategory === sub.s_category_name ? styles.optionItemActive : ""
        }`}
        onClick={() => handleSelectSubCategory(sub.s_category_name)}
      >
        {sub.s_category_name}
      </button>
    ));
  };

  return (
    <section className={styles.wrapper} aria-label="검색 결과 필터">
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>
            <span className={styles.keyword}>'{value.keyword || "전체"}'</span>{" "}
            검색결과
          </h2>
          <span className={styles.count}>총 322개</span>
        </div>
      </div>

      <div className={styles.topLine} />

      <div className={styles.filterTable}>
        <div className={styles.row}>
          <div className={styles.label}>
            <span>카테고리</span>
            <button
              type="button"
              className={styles.toggleButton}
              onClick={handleCategoryOpen}
              aria-label={isCategoryOpen ? "카테고리 닫기" : "카테고리 열기"}
            >
              <span className={styles.plus}>{isCategoryOpen ? "－" : "＋"}</span>
            </button>
          </div>

          <div className={styles.value}>
            <div className={styles.breadcrumb}>
              <button
                type="button"
                className={styles.breadcrumbButton}
                onClick={handleBreadcrumbAll}
              >
                전체
              </button>

              {value.mainCategory && (
                <>
                  <span className={styles.breadcrumbDivider}>&gt;</span>
                  <button
                    type="button"
                    className={styles.breadcrumbButton}
                    onClick={handleBreadcrumbMain}
                  >
                    {value.mainCategory}
                  </button>
                </>
              )}

              {value.subCategory && (
                <>
                  <span className={styles.breadcrumbDivider}>&gt;</span>
                  <button
                    type="button"
                    className={styles.breadcrumbButton}
                    onClick={handleBreadcrumbSub}
                  >
                    {value.subCategory}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {isCategoryOpen && (
          <div className={styles.categoryPanel}>
            <div className={styles.categoryPanelLabel} />
            <div className={styles.subCategoryList}>{renderCategoryPanelItems()}</div>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.label}>가격</div>
          <div className={styles.value}>
            <div className={styles.priceRow}>
              <input
                className={styles.priceInput}
                type="text"
                placeholder="최소 가격"
                value={value.minPrice}
                onChange={handleMinPriceChange}
              />
              <span className={styles.rangeMark}>~</span>
              <input
                className={styles.priceInput}
                type="text"
                placeholder="최대 가격"
                value={value.maxPrice}
                onChange={handleMaxPriceChange}
              />
              <button
                type="button"
                className={styles.applyButton}
                onClick={onSearch}
              >
                적용
              </button>
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>옵션</div>
          <div className={styles.value}>
            <div className={styles.optionRow}>
              <button
                type="button"
                className={`${styles.optionItem} ${
                  value.isLocker ? styles.optionItemActive : ""
                }`}
                onClick={toggleLocker}
              >
                보관함 거래 가능
              </button>

              <button
                type="button"
                className={`${styles.optionItem} ${
                  value.excludeSold ? styles.optionItemActive : ""
                }`}
                onClick={toggleExcludeSold}
              >
                판매완료 상품 제외
              </button>
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>선택한 필터</div>
          <div className={styles.value}>
            <div className={styles.selectedRow}>
              <div className={styles.selectedFilters}>
                {(value.mainCategory || value.subCategory) && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearMainCategory}
                  >
                    {value.subCategory
                      ? `전체 > ${value.mainCategory} > ${value.subCategory}`
                      : value.mainCategory
                      ? `전체 > ${value.mainCategory}`
                      : "전체"}{" "}
                    ×
                  </button>
                )}

                {value.isLocker && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearLocker}
                  >
                    보관함 거래 가능 ×
                  </button>
                )}

                {value.excludeSold && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearExcludeSold}
                  >
                    판매완료 상품 제외 ×
                  </button>
                )}

                {value.minPrice && (
                  <span className={styles.selectedItem}>
                    최소 {value.minPrice}원
                  </span>
                )}

                {value.maxPrice && (
                  <span className={styles.selectedItem}>
                    최대 {value.maxPrice}원
                  </span>
                )}
              </div>

              <button
                type="button"
                className={styles.resetButton}
                onClick={onReset}
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}