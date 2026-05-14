import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProductDetail = async (
    targetProductId: number,
    options?: {
      silent?: boolean;
      saveRecentViewed?: boolean;
    },
  ) => {
    const silent = options?.silent ?? false;
    const saveRecentViewed = options?.saveRecentViewed ?? true;

    try {
      if (!silent) {
        setLoading(true);
        setProduct(null);
      }

      setError("");

      const detail = await productApi.getProductDetail(targetProductId);

      setProduct(detail);

      if (saveRecentViewed) {
        addRecentViewedProduct({
          id: detail.PRODUCT_ID,
          title: detail.TITLE,
          price: detail.BASE_PRICE,
          imageUrl: getPrimaryProductImageUrl(detail.IMAGE),
        });
      }
    } catch (err) {
      console.error(err);

      if (!silent) {
        setError("상품 상세 정보를 불러오지 못했습니다.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleWishlistClick = async () => {
    if (!product) return;

    const accessToken = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    if (!accessToken || !userId) {
      console.warn("찜하기는 로그인이 필요한 기능입니다.");
      navigate("/signin");
      return;
    }

    try {
      await productApi.saveWishlist(product.PRODUCT_ID);

      setProduct((prev) => {
        if (!prev) return prev;

        const wasWished = prev.IS_WISHED === true || prev.IS_WISHED === 1;
        const currentWishCount = prev.WISH_COUNT ?? 0;

        return {
          ...prev,
          IS_WISHED: !wasWished,
          WISH_COUNT: wasWished
            ? Math.max(currentWishCount - 1, 0)
            : currentWishCount + 1,
        };
      });
    } catch (err) {
      console.error("찜하기 처리에 실패했습니다.", err);
    }
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [productId]);

  useEffect(() => {
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

    fetchProductDetail(parsedProductId);
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
            isWished={product.IS_WISHED}
            onWishlistClick={handleWishlistClick}
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
