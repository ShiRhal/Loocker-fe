import { useEffect, useState } from "react";
import RecentViewedBox from "../components/RecentViewedBox";
import SearchFilterBox from "../components/SearchFilterBox";
import PriceStatsBox from "../components/PriceStatsBox";
import ProductSortBar from "../components/ProductSortBar";
import ProductGrid from "../components/ProductGrid";
import styles from "./HomePage.module.css";
import type {
  PriceStats,
  ProductItem,
  SearchFilterValue,
  SortType,
} from "../types/home.types";
import { searchHomeProducts } from "../api/home.api";
import {
  toHomeSearchRequest,
  toPriceStats,
  toProductItems,
} from "../api/home.mapper";

const initialFilters: SearchFilterValue = {
  keyword: "",
  minPrice: "",
  maxPrice: "",
  isLocker: false,
  excludeSold: false,
  sort: "latest",
  mainCategory: "",
  subCategory: "",
  stateName: "",
  cityName: "",
};

const initialPriceStats: PriceStats = {
  totalCount: 0,
  avgPrice: 0,
  minPrice: 0,
  maxPrice: 0,
};

export default function HomePage() {
  const [draftFilters, setDraftFilters] =
    useState<SearchFilterValue>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<SearchFilterValue>(initialFilters);

  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [priceStats, setPriceStats] = useState<PriceStats>(initialPriceStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDraftFilterChange = (next: SearchFilterValue) => {
    setDraftFilters(next);
  };

  const handleImmediateApply = (next: SearchFilterValue) => {
    setDraftFilters(next);
    setAppliedFilters((prev) => ({
      ...prev,
      keyword: next.keyword,
      minPrice: next.minPrice,
      maxPrice: next.maxPrice,
      isLocker: next.isLocker,
      excludeSold: next.excludeSold,
      mainCategory: next.mainCategory,
      subCategory: next.subCategory,
      stateName: next.stateName,
      cityName: next.cityName,
      sort: next.sort,
    }));
    setPage(1);
  };

  const handleFilterReset = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  };

  const handleSearch = () => {
    if (draftFilters.minPrice && Number.isNaN(Number(draftFilters.minPrice))) {
      alert("최소 가격은 숫자만 입력해주세요.");
      return;
    }

    if (draftFilters.maxPrice && Number.isNaN(Number(draftFilters.maxPrice))) {
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

    setAppliedFilters((prev) => ({
      ...prev,
      keyword: draftFilters.keyword,
      minPrice: draftFilters.minPrice,
      maxPrice: draftFilters.maxPrice,
      stateName: draftFilters.stateName,
      cityName: draftFilters.cityName,
    }));
    setPage(1);
  };

  const handleSortChange = (nextSort: SortType) => {
    setDraftFilters((prev) => ({
      ...prev,
      sort: nextSort,
    }));

    setAppliedFilters((prev) => ({
      ...prev,
      sort: nextSort,
    }));

    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchHomeProducts() {
      setLoading(true);
      setError("");

      try {
        const request = toHomeSearchRequest(appliedFilters, page);
        const response = await searchHomeProducts(request);

        if (!isMounted) return;

        setPriceStats(toPriceStats(response.PRICE_STATUS));
        setProducts(toProductItems(response.PRODUCT_LIST));
      } catch (err) {
        console.error(err);

        if (!isMounted) return;

        setError("상품 목록을 불러오지 못했습니다.");
        setPriceStats(initialPriceStats);
        setProducts([]);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    fetchHomeProducts();

    return () => {
      isMounted = false;
    };
  }, [appliedFilters, page]);

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <SearchFilterBox
          value={draftFilters}
          resultKeyword={appliedFilters.keyword}
          totalCount={priceStats.totalCount}
          onChange={handleDraftFilterChange}
          onReset={handleFilterReset}
          onSearch={handleSearch}
          onImmediateApply={handleImmediateApply}
        />

        <PriceStatsBox stats={priceStats} />

        <ProductSortBar
          value={appliedFilters.sort}
          onChange={handleSortChange}
        />

        {error && <p>{error}</p>}

        <ProductGrid
          products={products}
          totalCount={priceStats.totalCount}
          currentPage={page}
          pageSize={40}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </section>

      <RecentViewedBox items={[]} />
    </div>
  );
}