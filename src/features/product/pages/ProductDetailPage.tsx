import { useEffect, useRef, useState } from "react";
import { message, Modal } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import {
  addRecentViewedProduct,
  removeRecentViewedProduct,
} from "../../../shared/utils/recentViewedStorage";
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

function getLoginUserId() {
  const savedUserId = localStorage.getItem("userId");
  const parsedUserId = savedUserId ? Number(savedUserId) : NaN;

  return Number.isNaN(parsedUserId) ? null : parsedUserId;
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const paymentHandledRef = useRef(false);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const [initialTradeId, setInitialTradeId] = useState<number | null>(null);
  const [initialPaid, setInitialPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
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

  const showDeleteSuccessMessage = () => {
    message.open({
      duration: 2.6,
      className: styles.deleteSuccessToast,
      content: (
        <div className={styles.deleteSuccessContent}>
          <span className={styles.deleteSuccessIcon}>✓</span>
          <div>
            <strong>판매글이 삭제되었습니다.</strong>
            <p>메인 페이지로 이동합니다.</p>
          </div>
        </div>
      ),
    });
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

    if (product.STATUS_CODE === "SOLD") {
      return;
    }

    setInitialTradeId(null);
    setInitialPaid(false);
    setTradeDrawerOpen(true);
  };

  const handleCloseTradeDrawer = () => {
    setTradeDrawerOpen(false);
    setInitialTradeId(null);
    setInitialPaid(false);
  };

  const handleEditProductClick = () => {
    if (!product) return;

    navigate(`/product/form?type=edit&productId=${product.PRODUCT_ID}`);
  };

  const handleDeleteProductClick = () => {
    if (!product || deleteLoading) return;

    const loginUserId = getLoginUserId();

    if (loginUserId === null) {
      message.error("로그인이 필요합니다.");
      navigate("/signin");
      return;
    }

    setDeleteModalOpen(true);
  };

  const handleCancelDeleteProduct = () => {
    if (deleteLoading) return;

    setDeleteModalOpen(false);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!product || deleteLoading) return;

    const loginUserId = getLoginUserId();

    if (loginUserId === null) {
      setDeleteModalOpen(false);
      message.error("로그인이 필요합니다.");
      navigate("/signin");
      return;
    }

    try {
      setDeleteLoading(true);

      await productApi.deleteProductDetail(product.PRODUCT_ID, loginUserId);

      removeRecentViewedProduct(product.PRODUCT_ID);

      setDeleteModalOpen(false);
      showDeleteSuccessMessage();

      window.setTimeout(() => {
        navigate("/");
      }, 700);
    } catch (err) {
      console.error("판매글 삭제 실패", err);
      message.error("판매글 삭제에 실패했습니다.");
    } finally {
      setDeleteLoading(false);
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

  const loginUserId = getLoginUserId();
  const isOwner =
    loginUserId !== null &&
    product.SELLER_ID != null &&
    loginUserId === product.SELLER_ID;

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
            isOwner={isOwner}
            onWishlistClick={handleWishlistClick}
            onBuyClick={handleOpenTradeDrawer}
            onEditClick={handleEditProductClick}
            onDeleteClick={handleDeleteProductClick}
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

      <Modal
        open={deleteModalOpen}
        width={320}
        centered
        footer={null}
        closable={!deleteLoading}
        maskClosable={!deleteLoading}
        className={styles.deleteConfirmModal}
        onCancel={handleCancelDeleteProduct}
      >
        <div className={styles.deleteModalContent}>
          <div className={styles.deleteModalIconBox}>!</div>

          <h2 className={styles.deleteModalTitle}>판매글을 삭제할까요?</h2>

          <p className={styles.deleteModalDescription}>
            삭제된 판매글과 이미지는 복구할 수 없습니다.
            <br />
            계속 진행하려면 아래 삭제 버튼을 눌러주세요.
          </p>

          <div className={styles.deleteModalButtonRow}>
            <button
              type="button"
              className={styles.deleteModalCancelButton}
              onClick={handleCancelDeleteProduct}
              disabled={deleteLoading}
            >
              취소
            </button>

            <button
              type="button"
              className={styles.deleteModalDeleteButton}
              onClick={() => void handleConfirmDeleteProduct()}
              disabled={deleteLoading}
            >
              {deleteLoading ? "삭제 중..." : "삭제하기"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}