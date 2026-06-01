import { useEffect, useMemo, useState } from "react";
import styles from "./SearchFilterBox.module.css";
import type { SearchFilterValue } from "../types/home.types";
import { useCodeOptions } from "../../../shared/hooks/useCodeOptions";

type SearchFilterBoxProps = {
  value: SearchFilterValue;
  appliedValue: SearchFilterValue;
  resultKeyword: string;
  totalCount: number;
  onChange: (next: SearchFilterValue) => void;
  onSearch: () => void;
  onReset: () => void;
  onImmediateApply: (next: SearchFilterValue) => void;
};

export default function SearchFilterBox({
  value,
  appliedValue,
  resultKeyword,
  totalCount,
  onChange,
  onSearch,
  onReset,
  onImmediateApply,
}: SearchFilterBoxProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const { states, cities, mainCategories, subCategories } = useCodeOptions();

  useEffect(() => {
    setIsCategoryOpen(false);
    setIsRegionOpen(false);
    setIsMobileFilterOpen(false);
  }, [resultKeyword]);

  const selectedMainId = useMemo(() => {
    if (!value.mainCategory) return null;

    const matchedMain = mainCategories.find(
      (main) => main.MAIN_CATEGORY === value.mainCategory,
    );

    return matchedMain ? matchedMain.ID : null;
  }, [value.mainCategory, mainCategories]);

  const selectedStateId = useMemo(() => {
    if (!value.stateName) return null;

    const matchedState = states.find((state) => state.STATE === value.stateName);

    return matchedState ? matchedState.ID : null;
  }, [value.stateName, states]);

  const filteredSubCategories = useMemo(() => {
    if (selectedMainId === null) return [];
    return subCategories.filter((sub) => sub.MAIN_ID === selectedMainId);
  }, [selectedMainId, subCategories]);

  const filteredCities = useMemo(() => {
    if (selectedStateId === null) return [];
    return cities.filter((city) => city.STATE_ID === selectedStateId);
  }, [selectedStateId, cities]);

  const displayKeyword = resultKeyword.trim();
  const selectedFilterCount = [
    appliedValue.mainCategory || appliedValue.subCategory,
    appliedValue.stateName || appliedValue.cityName,
    appliedValue.minPrice || appliedValue.maxPrice,
    appliedValue.isLocker,
    appliedValue.excludeSold,
  ].filter(Boolean).length;

  const applyImmediately = (next: SearchFilterValue) => {
    onChange(next);
    onImmediateApply(next);
  };

  const handleCategoryOpen = () => {
    setIsCategoryOpen((prev) => !prev);
  };

  const handleRegionOpen = () => {
    setIsRegionOpen((prev) => !prev);
  };

  const handleSelectMainCategory = (mainName: string) => {
    const next = {
      ...value,
      mainCategory: mainName,
      subCategory: "",
    };

    applyImmediately(next);
  };

  const handleSelectSubCategory = (subName: string) => {
    const next = {
      ...value,
      subCategory: subName,
    };

    applyImmediately(next);
  };

  const handleBreadcrumbAll = () => {
    setIsCategoryOpen(true);

    const next = {
      ...value,
      mainCategory: "",
      subCategory: "",
    };

    applyImmediately(next);
  };

  const handleBreadcrumbMain = () => {
    if (!value.mainCategory) return;

    setIsCategoryOpen(true);

    const next = {
      ...value,
      subCategory: "",
    };

    applyImmediately(next);
  };

  const handleBreadcrumbSub = () => {
    if (!value.mainCategory) return;
    setIsCategoryOpen(true);
  };

  const handleSelectState = (stateName: string) => {
    setIsRegionOpen(true);

    const next = {
      ...value,
      stateName,
      cityName: "",
    };

    applyImmediately(next);
  };

  const handleSelectCity = (cityName: string) => {
    const next = {
      ...value,
      cityName,
    };

    applyImmediately(next);
  };

  const handleRegionBreadcrumbAll = () => {
    setIsRegionOpen(true);

    const next = {
      ...value,
      stateName: "",
      cityName: "",
    };

    applyImmediately(next);
  };

  const handleRegionBreadcrumbState = () => {
    if (!value.stateName) return;

    setIsRegionOpen(true);

    const next = {
      ...value,
      cityName: "",
    };

    applyImmediately(next);
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

    applyImmediately(next);
  };

  const toggleExcludeSold = () => {
    const next = {
      ...value,
      excludeSold: !value.excludeSold,
    };

    applyImmediately(next);
  };

  const clearMainCategory = () => {
    const next = {
      ...value,
      mainCategory: "",
      subCategory: "",
    };

    applyImmediately(next);
  };

  const clearState = () => {
    const next = {
      ...value,
      stateName: "",
      cityName: "",
    };

    applyImmediately(next);
  };

  const clearLocker = () => {
    const next = {
      ...value,
      isLocker: false,
    };

    applyImmediately(next);
  };

  const clearExcludeSold = () => {
    const next = {
      ...value,
      excludeSold: false,
    };

    applyImmediately(next);
  };

  const clearMinPrice = () => {
    const next = {
      ...value,
      minPrice: "",
    };

    applyImmediately(next);
  };

  const clearMaxPrice = () => {
    const next = {
      ...value,
      maxPrice: "",
    };

    applyImmediately(next);
  };

  const renderCategoryPanelItems = () => {
    if (selectedMainId === null) {
      return mainCategories.map((main) => (
        <button
          key={main.ID}
          type="button"
          className={`${styles.categoryButton} ${
            value.mainCategory === main.MAIN_CATEGORY && !value.subCategory
              ? styles.optionItemActive
              : ""
          }`}
          onClick={() => handleSelectMainCategory(main.MAIN_CATEGORY)}
        >
          {main.MAIN_CATEGORY}
        </button>
      ));
    }

    return filteredSubCategories.map((sub) => (
      <button
        key={sub.ID}
        type="button"
        className={`${styles.categoryButton} ${
          value.subCategory === sub.SUB_CATEGORY ? styles.optionItemActive : ""
        }`}
        onClick={() => handleSelectSubCategory(sub.SUB_CATEGORY)}
      >
        {sub.SUB_CATEGORY}
      </button>
    ));
  };

  return (
    <section className={styles.wrapper} aria-label="검색 결과 필터">
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>
            {displayKeyword ? (
              <>
                <span className={styles.keyword}>'{displayKeyword}'</span>{" "}
                검색결과
              </>
            ) : (
              "검색결과"
            )}
          </h2>
          <span className={styles.count}>
            총 {totalCount.toLocaleString("ko-KR")}개
          </span>
        </div>
      </div>

      <div className={styles.topLine} />

      <button
        type="button"
        className={styles.mobileFilterToggle}
        onClick={() => setIsMobileFilterOpen((prev) => !prev)}
        aria-expanded={isMobileFilterOpen}
        aria-controls="home-search-filter-table"
      >
        <span>검색 필터</span>
        {selectedFilterCount > 0 ? (
          <strong>{selectedFilterCount}개 적용</strong>
        ) : (
          <strong>전체</strong>
        )}
        <span
          className={`${styles.mobileFilterToggleIcon} ${
            isMobileFilterOpen ? styles.mobileFilterToggleIconOpen : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        id="home-search-filter-table"
        className={`${styles.filterTable} ${
          isMobileFilterOpen ? styles.filterTableOpen : ""
        }`}
      >
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
          <div className={styles.label}>
            <span>지역</span>
            <button
              type="button"
              className={styles.toggleButton}
              onClick={handleRegionOpen}
              aria-label={isRegionOpen ? "지역 닫기" : "지역 열기"}
            >
              <span className={styles.plus}>{isRegionOpen ? "－" : "＋"}</span>
            </button>
          </div>

          <div className={styles.value}>
            <div className={styles.breadcrumb}>
              <button
                type="button"
                className={styles.breadcrumbButton}
                onClick={handleRegionBreadcrumbAll}
              >
                전체
              </button>

              {value.stateName && (
                <>
                  <span className={styles.breadcrumbDivider}>&gt;</span>
                  <button
                    type="button"
                    className={styles.breadcrumbButton}
                    onClick={handleRegionBreadcrumbState}
                  >
                    {value.stateName}
                  </button>
                </>
              )}

              {value.cityName && (
                <>
                  <span className={styles.breadcrumbDivider}>&gt;</span>
                  <span className={styles.breadcrumbCurrent}>
                    {value.cityName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {isRegionOpen && (
          <div className={styles.categoryPanel}>
            <div className={styles.categoryPanelLabel} />
            <div className={styles.regionBox}>
              <div className={styles.subCategoryList}>
                {states.map((state) => (
                  <button
                    key={state.ID}
                    type="button"
                    className={`${styles.categoryButton} ${
                      value.stateName === state.STATE && !value.cityName
                        ? styles.optionItemActive
                        : ""
                    }`}
                    onClick={() => handleSelectState(state.STATE)}
                  >
                    {state.STATE}
                  </button>
                ))}
              </div>

              {value.stateName && (
                <div className={styles.subCategoryList}>
                  {filteredCities.map((city) => (
                    <button
                      key={city.ID}
                      type="button"
                      className={`${styles.categoryButton} ${
                        value.cityName === city.CITY
                          ? styles.optionItemActive
                          : ""
                      }`}
                      onClick={() => handleSelectCity(city.CITY)}
                    >
                      {city.CITY}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                {(appliedValue.mainCategory || appliedValue.subCategory) && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearMainCategory}
                  >
                    {appliedValue.subCategory
                      ? `전체 > ${appliedValue.mainCategory} > ${appliedValue.subCategory}`
                      : `전체 > ${appliedValue.mainCategory}`}{" "}
                    ×
                  </button>
                )}

                {appliedValue.stateName && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearState}
                  >
                    {appliedValue.cityName
                      ? `지역: 전체 > ${appliedValue.stateName} > ${appliedValue.cityName}`
                      : `지역: 전체 > ${appliedValue.stateName}`}{" "}
                    ×
                  </button>
                )}

                {appliedValue.isLocker && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearLocker}
                  >
                    보관함 거래 가능 ×
                  </button>
                )}

                {appliedValue.excludeSold && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearExcludeSold}
                  >
                    판매완료 상품 제외 ×
                  </button>
                )}

                {appliedValue.minPrice && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearMinPrice}
                  >
                    최소 {appliedValue.minPrice}원 ×
                  </button>
                )}

                {appliedValue.maxPrice && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearMaxPrice}
                  >
                    최대 {appliedValue.maxPrice}원 ×
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