import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TradeMethodDrawer from "../drawers/TradeMethodDrawer";
import { tradeApi } from "../../trade/api/tradeApi";
import type { ProductTradePreview } from "../../trade/types/trade.types";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const numericProductId = Number(productId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [product, setProduct] = useState<ProductTradePreview | null>(null);

  useEffect(() => {
    if (!numericProductId || Number.isNaN(numericProductId)) return;

    tradeApi.getProductTradePreview(numericProductId).then(setProduct);
  }, [numericProductId]);

  if (!product) {
    return <div>상품 정보를 불러오는 중입니다.</div>;
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>임시 상품 상세 페이지</h1>
      <p>상품 ID: {product.productId}</p>
      <p>상품명: {product.title}</p>
      <p>가격: {product.expectedPrice.toLocaleString()}원</p>

      <button onClick={() => setDrawerOpen(true)}>구매하기</button>

      <TradeMethodDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        product={product}
      />
    </main>
  );
}
