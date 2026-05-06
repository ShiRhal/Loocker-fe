import { useEffect, useState } from "react";
import TradeMethodDrawer from "../drawers/TradeMethodDrawer";
import { tradeApi } from "../api/tradeApi";
import type { ProductTradePreview } from "../types/trade.types";
import { useParams } from "react-router-dom";

export default function ProductTradePage() {
  const { productId } = useParams();
  const numericProductId = Number(productId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [product, setProduct] = useState<ProductTradePreview | null>(null);

  useEffect(() => {
    if (!numericProductId || Number.isNaN(numericProductId)) return;

    tradeApi.getProductTradePreview(numericProductId).then(setProduct);
  }, [numericProductId]);

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  if (!product) {
    return <div>상품 정보를 불러오는 중입니다.</div>;
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>{product.title}</h1>
      <p>상품 ID: {product.productId}</p>
      <p>가격: {product.expectedPrice.toLocaleString()}원</p>
      <p>거래 가능 방식: {product.tradeType}</p>

      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.title}
          style={{
            width: 240,
            height: 240,
            objectFit: "cover",
            borderRadius: 12,
          }}
        />
      )}

      <br />
      <button type="button" onClick={handleOpenDrawer}>
        구매하기
      </button>

      <TradeMethodDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        product={product}
      />
    </main>
  );
}
