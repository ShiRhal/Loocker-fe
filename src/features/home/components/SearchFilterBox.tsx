import { useEffect, useMemo, useState } from "react";
import styles from "./SearchFilterBox.module.css";
import { api } from "../../../app/config/api";
import type { SearchFilterValue } from "../types/home.types";

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

type MainCategory = {
  ID: number;
  MAIN_CATEGORY: string;
};

type SubCategory = {
  ID: number;
  MAIN_ID: number;
  SUB_CATEGORY: string;
};

type StateCode = {
  ID: number;
  CODE: string;
  STATE: string;
};

type CityCode = {
  ID: number;
  STATE_ID: number;
  CODE: string;
  CITY: string;
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
  const [selectedMainId, setSelectedMainId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [states, setStates] = useState<StateCode[]>([]);
  const [cities, setCities] = useState<CityCode[]>([]);

  useEffect(() => {
    async function fetchCodes() {
      const [mainData, subData, stateData, cityData] = await Promise.all([
        api("/code/main/category", { method: "GET" }),
        api("/code/sub/category", { method: "GET" }),
        api("/code/state", { method: "GET" }),
        api("/code/city", { method: "GET" }),
      ]);

      setMainCategories(mainData as MainCategory[]);
      setSubCategories(subData as SubCategory[]);
      setStates(stateData as StateCode[]);
      setCities(cityData as CityCode[]);
    }

    fetchCodes();
  }, []);

  useEffect(() => {
    if (!value.mainCategory) {
      setSelectedMainId(null);
      return;
    }

    const matchedMain = mainCategories.find(
      (main) => main.MAIN_CATEGORY === value.mainCategory,
    );

    setSelectedMainId(matchedMain ? matchedMain.ID : null);
  }, [value.mainCategory, mainCategories]);

  useEffect(() => {
    if (!value.stateName) {
      setSelectedStateId(null);
      return;
    }

    const matchedState = states.find(
      (state) => state.STATE === value.stateName,
    );

    setSelectedStateId(matchedState ? matchedState.ID : null);
  }, [value.stateName, states]);

  const filteredSubCategories = useMemo(() => {
    if (selectedMainId === null) return [];
    return subCategories.filter((sub) => sub.MAIN_ID === selectedMainId);
  }, [selectedMainId, subCategories]);

  const filteredCities = useMemo(() => {
    if (selectedStateId === null) return [];
    return cities.filter((city) => city.STATE_ID === selectedStateId);
  }, [selectedStateId, cities]);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, keyword: e.target.value });
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStateName = e.target.value;
    const matchedState = states.find((state) => state.STATE === nextStateName);

    setSelectedStateId(matchedState ? matchedState.ID : null);

    const next = {
      ...value,
      stateName: nextStateName,
      cityName: "",
    };

    onChange(next);
    onImmediateApply(next);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = { ...value, cityName: e.target.value };

    onChange(next);
    onImmediateApply(next);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, minPrice: e.target.value.replace(/[^0-9]/g, "") });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, maxPrice: e.target.value.replace(/[^0-9]/g, "") });
  };

  const toggleLocker = () => {
    onImmediateApply({ ...value, isLocker: !value.isLocker });
  };

  const toggleExcludeSold = () => {
    onImmediateApply({ ...value, excludeSold: !value.excludeSold });
  };

  const clearKeyword = () => {
    const next = { ...value, keyword: "" };
    onChange(next);
    onImmediateApply(next);
  };

  const clearMainCategory = () => {
    onImmediateApply({ ...value, mainCategory: "", subCategory: "" });
  };

  const clearState = () => {
    setSelectedStateId(null);
    const next = { ...value, stateName: "", cityName: "" };
    onChange(next);
    onImmediateApply(next);
  };

  const clearCity = () => {
    const next = { ...value, cityName: "" };
    onChange(next);
    onImmediateApply(next);
  };

  const clearExcludeSold = () => {
    onImmediateApply({ ...value, excludeSold: false });
  };

  const clearLocker = () => {
    onImmediateApply({ ...value, isLocker: false });
  };

  const clearMinPrice = () => {
    const next = { ...value, minPrice: "" };
    onChange(next);
    onImmediateApply(next);
  };

  const clearMaxPrice = () => {
    const next = { ...value, maxPrice: "" };
    onChange(next);
    onImmediateApply(next);
  };

  const handleCategoryOpen = () => {
    setIsCategoryOpen((prev) => !prev);
  };

  const handleSelectMainCategory = (mainId: number, mainName: string) => {
    setSelectedMainId(mainId);

    onImmediateApply({
      ...value,
      mainCategory: mainName,
      subCategory: "",
    });
  };

  const handleSelectSubCategory = (subName: string) => {
    onImmediateApply({
      ...value,
      subCategory: subName,
    });
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

    const matchedMain = mainCategories.find(
      (main) => main.MAIN_CATEGORY === value.mainCategory,
    );

    setSelectedMainId(matchedMain ? matchedMain.ID : null);
    setIsCategoryOpen(true);

    onImmediateApply({
      ...value,
      subCategory: "",
    });
  };

  const handleBreadcrumbSub = () => {
    if (!value.mainCategory) return;

    const matchedMain = mainCategories.find(
      (main) => main.MAIN_CATEGORY === value.mainCategory,
    );

    setSelectedMainId(matchedMain ? matchedMain.ID : null);
    setIsCategoryOpen(true);
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
          onClick={() => handleSelectMainCategory(main.ID, main.MAIN_CATEGORY)}
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
            <span className={styles.keyword}>'{resultKeyword || "전체"}'</span>{" "}
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
              <span className={styles.plus}>
                {isCategoryOpen ? "－" : "＋"}
              </span>
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
                {states.map((state) => (
                  <option key={state.ID} value={state.STATE}>
                    {state.STATE}
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
                  <option key={city.ID} value={city.CITY}>
                    {city.CITY}
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
                {appliedValue.keyword && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearKeyword}
                  >
                    검색어: {appliedValue.keyword} ×
                  </button>
                )}

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
                    지역: {appliedValue.stateName} ×
                  </button>
                )}

                {appliedValue.cityName && (
                  <button
                    type="button"
                    className={styles.selectedItem}
                    onClick={clearCity}
                  >
                    시: {appliedValue.cityName} ×
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
