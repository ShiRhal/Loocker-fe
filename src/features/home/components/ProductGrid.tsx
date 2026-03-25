import ProductCard from "./ProductCard";
import type { ProductItem } from "../types/home.types";
import styles from "./ProductGrid.module.css";

/*
  상품 카드들을 5열 그리드로 렌더링하는 컴포넌트입니다.
*/

type ProductGridProps = {
  products: ProductItem[];
};

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <section className={styles.grid} aria-label="상품 목록">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}