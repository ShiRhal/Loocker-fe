import ProductCard from "./ProductCard";
import type { ProductItem } from "../types/home.types";
import styles from "./ProductGrid.module.css";

type ProductGridProps = {
  products: ProductItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  loading: boolean;
};

function getPageNumbers(totalCount: number, pageSize: number) {
  const totalPages = Math.ceil(totalCount / pageSize);
  return Array.from({ length: totalPages }, (_, index) => index + 1);
}

export default function ProductGrid({
  products,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  loading,
}: ProductGridProps) {
  const pageNumbers = getPageNumbers(totalCount, pageSize);

  if (loading) {
    return (
      <section aria-label="상품 목록" className={styles.wrapper}>
        <p className={styles.message}>불러오는 중...</p>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section aria-label="상품 목록" className={styles.wrapper}>
        <p className={styles.message}>검색 결과가 없습니다.</p>
      </section>
    );
  }

  return (
    <section aria-label="상품 목록" className={styles.wrapper}>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {pageNumbers.length > 1 && (
        <div className={styles.pagination}>
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`${styles.pageButton} ${
                currentPage === pageNumber ? styles.pageButtonActive : ""
              }`}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}