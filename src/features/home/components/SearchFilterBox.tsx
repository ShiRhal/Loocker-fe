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
  const [selectedMainId, setSelectedMainId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  useEffect(() => {
    setIsCategoryOpen(false);
    setIsRegionOpen(false);
  }, [resultKeyword]);

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

  const displayKeyword = resultKeyword.trim();

  const handleSelectState = (stateName: string, stateId: number) => {
    setSelectedStateId(stateId);
    setIsRegionOpen(true);

    const next = {
      ...value,
      stateName,
      cityName: "",
    };

    onChange(next);
    onImmediateApply(next);
  };

  const handleSelectCity = (cityName: string) => {
    const next = {
      ...value,
      cityName,
    };

    onChange(next);
    onImmediateApply(next);
  };

  const handleRegionBreadcrumbAll = () => {
    setSelectedStateId(null);
    setIsRegionOpen(true);

    const next = {
      ...value,
      stateName: "",
      cityName: "",
    };

    onChange(next);
    onImmediateApply(next);
  };

  const handleRegionBreadcrumbState = () => {
    if (!value.stateName) return;

    const matchedState = STATE_CODES.find(
      (state) => state.state_name === value.stateName
    );

    setSelectedStateId(matchedState ? matchedState.s_id : null);
    setIsRegionOpen(true);

    const next = {
      ...value,
      cityName: "",
    };

    onChange(next);
    onImmediateApply(next);
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

  const clearLocker = () => {
    const next = {
      ...value,
      isLocker: false,
    };
    onImmediateApply(next);
  };

  const clearExcludeSold = () => {
    const next = {
      ...value,
      excludeSold: false,
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

  const handleRegionOpen = () => {
    setIsRegionOpen((prev) => !prev);
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
            {displayKeyword ? (
              <>
                <span className={styles.keyword}>'{displayKeyword}'</span> 검색결과
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
                {STATE_CODES.map((state) => (
                  <button
                    key={state.s_id}
                    type="button"
                    className={`${styles.categoryButton} ${
                      value.stateName === state.state_name && !value.cityName
                        ? styles.optionItemActive
                        : ""
                    }`}
                    onClick={() =>
                      handleSelectState(state.state_name, state.s_id)
                    }
                  >
                    {state.state_name}
                  </button>
                ))}
              </div>

              {value.stateName && (
                <div className={styles.subCategoryList}>
                  {filteredCities.map((city) => (
                    <button
                      key={city.c_id}
                      type="button"
                      className={`${styles.categoryButton} ${
                        value.cityName === city.city_name
                          ? styles.optionItemActive
                          : ""
                      }`}
                      onClick={() => handleSelectCity(city.city_name)}
                    >
                      {city.city_name}
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