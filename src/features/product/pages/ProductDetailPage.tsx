import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getOrCreateChatRoomForProduct } from "../../chat/api/chatApi";
import { useChatDrawer } from "../../chat/context/ChatDrawerContext";
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
import TradeMethodDrawer from "../../trade/drawers/TradeMethodDrawer";
import { tradeApi } from "../../trade/api/tradeApi";
import type { ProductTradePreview } from "../../trade/types/trade.types";

function toProductTradePreview(product: ProductDetail): ProductTradePreview {
  return {
    productId: product.PRODUCT_ID,
    title: product.TITLE,
    imageUrl: getPrimaryProductImageUrl(product.IMAGE),
    expectedPrice: product.BASE_PRICE,
    tradeType: product.TRADE_TYPE ?? "",
  };
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { openChatRoom } = useChatDrawer();

  const paymentHandledRef = useRef(false);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const [initialTradeId, setInitialTradeId] = useState<number | null>(null);
  const [initialPaid, setInitialPaid] = useState(false);
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

  const handleOpenTradeDrawer = () => {
    if (!product) return;

    if (product.STATUS_CODE !== "SALE") {
      return;
    }
    setInitialTradeId(null);
    setInitialPaid(false);
    setTradeDrawerOpen(true);
  };

  const handleChatClick = async () => {
    if (!product) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      const redirect = encodeURIComponent(
        `${location.pathname}${location.search}`,
      );
      navigate(`/signin?redirect=${redirect}`);
      return;
    }

    try {
      const baseRoom = await getOrCreateChatRoomForProduct(product.PRODUCT_ID);
      const thumb = getPrimaryProductImageUrl(product.IMAGE);
      openChatRoom({
        ...baseRoom,
        TITLE: baseRoom.TITLE ?? product.TITLE,
        TARGET_NICKNAME:
          baseRoom.TARGET_NICKNAME ?? product.NICKNAME ?? "판매자",
        IMAGE_URL: baseRoom.IMAGE_URL ?? thumb ?? null,
      });
    } catch (err) {
      console.error(err);
      message.error(
        err instanceof Error ? err.message : "채팅을 시작할 수 없습니다.",
      );
    }
  };

  const handleCloseTradeDrawer = () => {
    setTradeDrawerOpen(false);
    setInitialTradeId(null);
    setInitialPaid(false);
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get("payment");

    if (!payment) {
      paymentHandledRef.current = false;
      return;
    }

    if (paymentHandledRef.current) return;

    const cleanUrl = `/product/${productId}`;

    const handlePaymentResult = async () => {
      if (payment === "fail") {
        paymentHandledRef.current = true;
        sessionStorage.removeItem("pendingPayment");

        message.error("결제가 실패했습니다.");
        navigate(cleanUrl, { replace: true });
        return;
      }

      if (payment !== "success") return;

      const tradeId = params.get("tradeId");
      const paymentKey = params.get("paymentKey");
      const orderId = params.get("orderId");
      const amount = params.get("amount");

      const numericTradeId = Number(tradeId);
      const numericAmount = Number(amount);

      if (!numericTradeId || Number.isNaN(numericTradeId)) {
        paymentHandledRef.current = true;
        sessionStorage.removeItem("pendingPayment");

        message.error("거래 ID를 확인할 수 없습니다.");
        navigate(cleanUrl, { replace: true });
        return;
      }

      if (!paymentKey || !orderId || !amount || Number.isNaN(numericAmount)) {
        paymentHandledRef.current = true;
        sessionStorage.removeItem("pendingPayment");

        message.error("결제 승인 정보를 확인할 수 없습니다.");
        navigate(cleanUrl, { replace: true });
        return;
      }

      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        paymentHandledRef.current = true;
        sessionStorage.removeItem("pendingPayment");

        message.error("로그인이 필요합니다.");
        navigate(cleanUrl, { replace: true });
        return;
      }

      try {
        paymentHandledRef.current = true;

        await tradeApi.updatePaymentPaid(accessToken, {
          TRADE_ID: numericTradeId,
          AMOUNT: numericAmount,
          ORDER_ID: orderId,
          PAYMENT_KEY: paymentKey,
        });

        await tradeApi.updateTradeStatus(accessToken, {
          TRADE_ID: numericTradeId,
          RESULT_STATUS_CODE: "TRADING",
          NEXT_STATUS_CODE: "PAID",
          TRADE_TYPE_CODE: "DELIVERY",
          USER_ID: 0,
        });

        sessionStorage.removeItem("pendingPayment");

        setInitialTradeId(numericTradeId);
        setInitialPaid(true);
        setTradeDrawerOpen(true);

        navigate(cleanUrl, { replace: true });
      } catch (err) {
        console.error(err);
        sessionStorage.removeItem("pendingPayment");

        message.error("결제 승인 처리에 실패했습니다.");
        navigate(cleanUrl, { replace: true });
      }
    };

    handlePaymentResult();
  }, [location.search, navigate, productId]);

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

  const tradePreview = toProductTradePreview(product);

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
            statusCode={product.STATUS_CODE}
            isWished={product.IS_WISHED}
            onWishlistClick={handleWishlistClick}
            onChatClick={() => void handleChatClick()}
            onBuyClick={handleOpenTradeDrawer}
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

      <TradeMethodDrawer
        open={tradeDrawerOpen}
        onClose={handleCloseTradeDrawer}
        product={tradePreview}
        initialTradeId={initialTradeId}
        initialPaid={initialPaid}
      />
    </div>
  );
}