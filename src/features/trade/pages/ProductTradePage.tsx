import { useEffect, useState } from "react";
import { message } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TradeMethodDrawer from "../drawers/TradeMethodDrawer";
import { tradeApi } from "../api/tradeApi";
import type { ProductTradePreview } from "../types/trade.types";

function getStatusCode(result: unknown) {
  if (typeof result === "string") return result;

  if (typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;
    return String(
      obj.STATUS_CODE ?? obj.statusCode ?? obj.RESULT_STATUS_CODE ?? "",
    );
  }

  return "";
}

export default function ProductTradePage() {
  const { productId, tradeId } = useParams();
  const location = useLocation();
  const nav = useNavigate();

  const numericProductId = Number(productId);
  const numericTradeId = tradeId ? Number(tradeId) : null;

  const [drawerOpen, setDrawerOpen] = useState(
    location.pathname.includes("/trade"),
  );
  const [product, setProduct] = useState<ProductTradePreview | null>(null);
  const [initialPaid, setInitialPaid] = useState(false);

  useEffect(() => {
    if (!numericProductId || Number.isNaN(numericProductId)) return;

    tradeApi.getProductTradePreview(numericProductId).then(setProduct);
  }, [numericProductId]);

  useEffect(() => {
    setDrawerOpen(location.pathname.includes("/trade"));
  }, [location.pathname]);

  useEffect(() => {
    if (!product || !numericTradeId) return;

    const params = new URLSearchParams(location.search);
    const payment = params.get("payment");
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = params.get("amount");
    const accessToken = localStorage.getItem("accessToken");

    if (payment !== "success") return;
    if (!paymentKey || !orderId || !amount || !accessToken) return;

    const handlePaymentSuccess = async () => {
      try {
        await tradeApi.updatePayment(accessToken, {
          TRADE_ID: numericTradeId,
          AMOUNT: Number(amount),
          ORDER_ID: orderId,
          PAYMENT_KEY: paymentKey,
        });

        const tradeResult = await tradeApi.updateTradeStatus(accessToken, {
          TRADE_ID: numericTradeId,
          NEXT_STATUS_CODE: "PAID",
          TRADE_TYPE_CODE: "DELIVERY",
        });

        const statusCode = getStatusCode(tradeResult);

        if (statusCode === "PAID" || statusCode === "TR_04" || !statusCode) {
          setInitialPaid(true);
          message.success("결제가 완료되었습니다.");

          nav(`/product/${numericProductId}/trade/${numericTradeId}`, {
            replace: true,
          });
        }
      } catch (error) {
        console.error(error);
        message.error("결제 완료 처리에 실패했습니다.");
      }
    };

    handlePaymentSuccess();
  }, [location.search, product, numericTradeId, numericProductId, nav]);

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
    nav(`/product/${numericProductId}/trade`);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setInitialPaid(false);
    nav(`/product/${numericProductId}`);
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
      <button onClick={handleOpenDrawer}>구매하기</button>

      <TradeMethodDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        product={product}
        initialTradeId={numericTradeId}
        initialPaid={initialPaid}
      />
    </main>
  );
}
