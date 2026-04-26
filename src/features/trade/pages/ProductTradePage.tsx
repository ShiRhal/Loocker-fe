import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "antd";
import useTradeDrawer from "../hooks/useTradeDrawer";
import TradeMethodDrawer from "../drawers/TradeMethodDrawer";
import { tradeApi } from "../api/tradeApi";
import type { ProductTradePreview } from "../types/trade.types";
import styles from "./ProductTradePage.module.css";

export default function ProductTradePage() {
  const { productId } = useParams();
  const { open, openDrawer, closeDrawer } = useTradeDrawer();
  const [product, setProduct] = useState<ProductTradePreview | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      const preview = await tradeApi.getProductTradePreview(Number(productId));
      setProduct(preview);
    }

    fetchPreview();
  }, [productId]);

  if (!product) {
    return <div className={styles.page}>로딩중...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.productId}>상품 ID: {product.productId}</div>
        <h1 className={styles.title}>거래 테스트</h1>
        <p className={styles.description}>이 페이지는 상품 상세 임시 페이지</p>

        <Button type="primary" size="large" onClick={openDrawer}>
          구매하기
        </Button>
      </div>

      <TradeMethodDrawer open={open} onClose={closeDrawer} product={product} />
    </div>
  );
}
