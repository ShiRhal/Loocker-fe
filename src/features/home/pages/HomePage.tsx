import { useState } from "react";
import RecentViewedBox from "../components/RecentViewedBox";
import SearchFilterBox from "../components/SearchFilterBox";
import PriceStatsBox from "../components/PriceStatsBox";
import ProductSortBar from "../components/ProductSortBar";
import ProductGrid from "../components/ProductGrid";
import { mockProducts } from "../mock/homeProducts";
import styles from "./HomePage.module.css";
import type { SearchFilterValue, SortType } from "../types/home.types";

const initialFilters: SearchFilterValue = {
  keyword: "",
  minPrice: "",
  maxPrice: "",
  isLocker: false,
  excludeSold: false,
  sort: "latest",
  mainCategory: "",
  subCategory: "",
};

export default function HomePage() {
  const [draftFilters, setDraftFilters] =
    useState<SearchFilterValue>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<SearchFilterValue>(initialFilters);

  const handleDraftFilterChange = (next: SearchFilterValue) => {
    setDraftFilters(next);
  };

  const handleImmediateApply = (next: SearchFilterValue) => {
    setDraftFilters(next);
    setAppliedFilters({
      ...appliedFilters,
      keyword: next.keyword,
      isLocker: next.isLocker,
      excludeSold: next.excludeSold,
      mainCategory: next.mainCategory,
      subCategory: next.subCategory,
      sort: next.sort,
    });
  };

  const handleFilterReset = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const handleSearch = () => {
    if (draftFilters.minPrice && isNaN(Number(draftFilters.minPrice))) {
      alert("최소 가격은 숫자만 입력해주세요.");
      return;
    }

    if (draftFilters.maxPrice && isNaN(Number(draftFilters.maxPrice))) {
      alert("최대 가격은 숫자만 입력해주세요.");
      return;
    }

    if (
      draftFilters.minPrice &&
      draftFilters.maxPrice &&
      Number(draftFilters.minPrice) > Number(draftFilters.maxPrice)
    ) {
      alert("최소 가격이 최대 가격보다 클 수 없습니다.");
      return;
    }

    const nextAppliedFilters = {
      ...appliedFilters,
      keyword: draftFilters.keyword,
      minPrice: draftFilters.minPrice,
      maxPrice: draftFilters.maxPrice,
    };

    setAppliedFilters(nextAppliedFilters);
    console.log("현재 적용된 검색 조건:", nextAppliedFilters);
  };

  const handleSortChange = (nextSort: SortType) => {
    const nextDraftFilters = {
      ...draftFilters,
      sort: nextSort,
    };

    setDraftFilters(nextDraftFilters);
    setAppliedFilters({
      ...appliedFilters,
      sort: nextSort,
    });
  };

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <SearchFilterBox
          value={draftFilters}
          onChange={handleDraftFilterChange}
          onReset={handleFilterReset}
          onSearch={handleSearch}
          onImmediateApply={handleImmediateApply}
        />

        <PriceStatsBox />

        <ProductSortBar
          value={appliedFilters.sort}
          onChange={handleSortChange}
        />

        <ProductGrid products={mockProducts} />
      </section>

      <RecentViewedBox items={[]} />
    </div>
  );
}