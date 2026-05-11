import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RecentViewedBox from "../../home/components/RecentViewedBox";
import { productApi } from "../api/productapi";
import type { ProductDetail } from "../types/product.types";
import styles from "./ProductDetailPage.module.css";
import ProductImageGallery, {
  getPrimaryProductImageUrl,
} from "../components/ProductImageGallery";
import ProductSummary from "../components/ProductSummary";
import ProductDescriptionSection from "../components/ProductDescriptionSection";
import SellerInfoSection from "../components/SellerInfoSection";
import { addRecentViewedProduct } from "../../../shared/utils/recentViewedStorage";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [productId]);

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!productId) {
        setError("상품 ID가 없습니다.");
        setLoading(false);
        return;
      }

      const parsedProductId = Number(productId);

      if (Number.isNaN(parsedProductId)) {
        setError("올바르지 않은 상품 ID입니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setProduct(null);

        const detail = await productApi.getProductDetail(parsedProductId);

        setProduct(detail);

        addRecentViewedProduct({
          id: detail.PRODUCT_ID,
          title: detail.TITLE,
          price: detail.BASE_PRICE,
          imageUrl: getPrimaryProductImageUrl(detail.IMAGE),
        });
      } catch (err) {
        console.error(err);
        setError("상품 상세 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId]);

  if (loading) {
    return (
      <main className={styles.message}>상품 정보를 불러오는 중입니다.</main>
    );
  }

  if (error) {
    return <main className={styles.message}>{error}</main>;
  }

  if (!product) {
    return <main className={styles.message}>상품 정보가 없습니다.</main>;
  }

  return (
    <div className={styles.pageShell}>
      <main className={styles.page}>
        <section className={styles.topSection}>
          <ProductImageGallery images={product.IMAGE} title={product.TITLE} />

          <ProductSummary
            title={product.TITLE}
            price={product.BASE_PRICE}
            mainCategory={product.MAIN_CATEGORY}
            subCategory={product.SUB_CATEGORY}
            createdAt={product.CREATED_AT}
            viewCount={product.VIEW_COUNT}
            chatCount={product.CHAT_COUNT}
            wishCount={product.WISH_COUNT}
            tradeType={product.TRADE_TYPE}
            state={product.STATE}
            city={product.CITY}
            accessoryStatus={product.ACCESSORY_STATUS}
          />
        </section>

        <section className={styles.bottomSection}>
          <ProductDescriptionSection description={product.DESCRIPTION} />
          <SellerInfoSection nickname={product.NICKNAME} />
        </section>
      </main>

      <div className={styles.recentViewedArea}>
        <RecentViewedBox />
      </div>
    </div>
  );
}
