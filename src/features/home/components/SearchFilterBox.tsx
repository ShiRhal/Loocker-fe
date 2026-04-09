import { useEffect, useMemo, useState } from "react";
import styles from "./SearchFilterBox.module.css";
import type { SearchFilterValue } from "../types/home.types";
import {
  MAIN_CATEGORIES,
  SUB_CATEGORIES,
} from "../../../shared/constants/category";
import {
  STATE_CODES,
  CITY_CODES,
} from "../../../shared/constants/location";

type SearchFilterBoxProps = {
  value: SearchFilterValue;
  resultKeyword: string;
  totalCount: number;
  onChange: (next: SearchFilterValue) => void;
  onSearch: () => void;
  onReset: () => void;
  onImmediateApply: (next: SearchFilterValue) => void;
};

export default function SearchFilterBox({
  value,
  resultKeyword,
  totalCount,
  onChange,
  onSearch,
  onReset,
  onImmediateApply,
}: SearchFilterBoxProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedMainId, setSelectedMainId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  useEffect(() => {
    if (!value.mainCategory) {
      setSelectedMainId(null);
      return;
    }

    const matchedMain = MAIN_CATEGORIES.find(
      (main) => main.m_category_name === value.mainCategory
    );

    setSelectedMainId(matchedMain ? matchedMain.m_category_id : null);
  }, [value.mainCategory]);

  useEffect(() => {
    if (!value.stateName) {
      setSelectedStateId(null);
      return;
    }

    const matchedState = STATE_CODES.find(
      (state) => state.state_name === value.stateName
    );

    setSelectedStateId(matchedState ? matchedState.s_id : null);
  }, [value.stateName]);

  const filteredSubCategories = useMemo(() => {
    if (selectedMainId === null) return [];
    return SUB_CATEGORIES.filter((sub) => sub.parent_id === selectedMainId);
  }, [selectedMainId]);

  const filteredCities = useMemo(() => {
    if (selectedStateId === null) return [];
    return CITY_CODES.filter((city) => city.parent_id === selectedStateId);
  }, [selectedStateId]);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      keyword: e.target.value,
    });
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStateName = e.target.value;

    const matchedState = STATE_CODES.find(
      (state) => state.state_name === nextStateName
    );

    setSelectedStateId(matchedState ? matchedState.s_id : null);

    onChange({
      ...value,
      stateName: nextStateName,
      cityName: "",
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...value,
      cityName: e.target.value,
    });
  };

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

  const clearKeyword = () => {
    const next = {
      ...value,
      keyword: "",
    };
    onChange(next);
    onImmediateApply(next);
  };

  const clearMainCategory = () => {
    const next = {
      ...value,
      mainCategory: "",
      subCategory: "",
    };
    onImmediateApply(next);
  };

  const clearState = () => {
    setSelectedStateId(null);

    const next = {
      ...value,
      stateName: "",
      cityName: "",
    };
    onChange(next);
    onImmediateApply(next);
  };

  const clearCity = () => {
    const next = {
      ...value,
      cityName: "",
    };
    onChange(next);
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

  const clearMinPrice = () => {
    const next = {
      ...value,
      minPrice: "",
    };
    onChange(next);
    onImmediateApply(next);
  };

  const clearMaxPrice = () => {
    const next = {
      ...value,
      maxPrice: "",
    };
    onChange(next);
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
    setIsCategoryOpen(true);
    onImmediateApply({
      ...value,
      mainCategory: "",
      subCategory: "",
    });
  };

  const handleBreadcrumbMain = () => {
    if (!value.mainCategory) return;

    const matchedMain = MAIN_CATEGORIES.find(
      (main) => main.m_category_name === value.mainCategory
    );

    setSelectedMainId(matchedMain ? matchedMain.m_category_id : null);
    setIsCategoryOpen(true);

    onImmediateApply({
      ...value,
      subCategory: "",
    });
  };

  const handleBreadcrumbSub = () => {
    if (!value.mainCategory) return;

    const matchedMain = MAIN_CATEGORIES.find(
      (main) => main.m_category_name === value.mainCategory
    );

    setSelectedMainId(matchedMain ? matchedMain.m_category_id : null);
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
          value.subCategory === sub.s_category_name
            ? styles.optionItemActive
            : ""
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
            <span className={styles.keyword}>
              '{resultKeyword || "전체"}'
            </span>{" "}
            검색결과
          </h2>
          <span className={styles.count}>
            총 {totalCount.toLocaleString("ko-KR")}개
          </span>
        </div>
      </div>

      <div className={styles.topLine} />

      <div className={styles.filterTable}>
        <div className={styles.row}>
          <div className={styles.label}>검색어</div>
          <div className={styles.value}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="상품명을 입력해주세요."
              value={value.keyword}
              onChange={handleKeywordChange}
              onKeyDown={handleKeywordKeyDown}
            />
          </div>
        </div>

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
            <div className={styles.subCategoryList}>
              {renderCategoryPanelItems()}
            </div>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.label}>지역</div>
          <div className={styles.value}>
            <div className={styles.regionRow}>
              <select
                className={styles.regionSelect}
                value={value.stateName}
                onChange={handleStateChange}
              >
                <option value="">도 선택</option>
                {STATE_CODES.map((state) => (
                  <option key={state.s_id} value={state.state_name}>
                    {state.state_name}
                  </option>
                ))}
              </select>

              <select
                className={styles.regionSelect}
                value={value.cityName}
                onChange={handleCityChange}
                disabled={!value.stateName}
              >
                <option value="">시 선택</option>
                {filteredCities.map((city) => (
                  <option key={city.c_id} value={city.city_name}>
                    {city.city_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
                {value.keyword && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearKeyword}
                  >
                    검색어: {value.keyword} ×
                  </button>
                )}

                {(value.mainCategory || value.subCategory) && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearMainCategory}
                  >
                    {value.subCategory
                      ? `전체 > ${value.mainCategory} > ${value.subCategory}`
                      : `전체 > ${value.mainCategory}`}{" "}
                    ×
                  </button>
                )}

                {value.stateName && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearState}
                  >
                    지역: {value.stateName} ×
                  </button>
                )}

                {value.cityName && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearCity}
                  >
                    시: {value.cityName} ×
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
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearMinPrice}
                  >
                    최소 {value.minPrice}원 ×
                  </button>
                )}

                {value.maxPrice && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearMaxPrice}
                  >
                    최대 {value.maxPrice}원 ×
                  </button>
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