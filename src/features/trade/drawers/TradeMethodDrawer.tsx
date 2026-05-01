import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, Button, message } from "antd";
import { nanoid } from "nanoid";
import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import TradeProgressView from "../components/TradeProgressView";
import { tradeApi } from "../api/tradeApi";
import { useAuth } from "../../../app/providers/auth/useAuth";
import type {
  ProductTradePreview,
  TradeMethodOption,
  TradeTab,
} from "../types/trade.types";
import styles from "./TradeMethodDrawer.module.css";

declare global {
  interface Window {
    TossPayments?: any;
  }
}

type ProgressTradeType = Exclude<TradeTab, "LOCKER">;

type Props = {
  open: boolean;
  onClose: () => void;
  product: ProductTradePreview;
  initialTradeId?: number | null;
  initialPaid?: boolean;
};

const TOSS_CLIENT_KEY = "test_ck_QbgMGZzorzzY5z652y7Krl5E1em4";
const TOSS_SCRIPT_URL = "https://js.tosspayments.com/v1/payment";

const OPTIONS: Record<TradeTab, TradeMethodOption[]> = {
  DELIVERY: [
    {
      id: "DELIVERY",
      title: "택배거래",
      description: "Toss 결제 후 택배거래를 진행합니다.",
    },
  ],
  DIRECT: [
    {
      id: "DIRECT",
      title: "직거래",
      description: "판매자와 직접 만나 상품을 확인하고 거래합니다.",
    },
  ],
  LOCKER: [
    {
      id: "LOCKER",
      title: "보관함거래",
      description: "보관함 거래는 추후 지원 예정입니다.",
    },
  ],
};

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function toProgressTradeType(tab: TradeTab): ProgressTradeType {
  return tab === "LOCKER" ? "DELIVERY" : tab;
}

function getNickname(me: unknown) {
  const user = me as Record<string, unknown> | null;

  return (
    String(
      user?.nickname ?? user?.NICKNAME ?? user?.USER_NICKNAME ?? "구매자",
    ).trim() || "구매자"
  );
}

function loadTossScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.TossPayments) {
      resolve();
      return;
    }

    const existed = document.querySelector(`script[src="${TOSS_SCRIPT_URL}"]`);

    if (existed) {
      existed.addEventListener("load", () => resolve());
      existed.addEventListener("error", () =>
        reject(new Error("Toss 스크립트 로드 실패")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TOSS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Toss 스크립트 로드 실패"));
    document.body.appendChild(script);
  });
}

export default function TradeMethodDrawer({
  open,
  onClose,
  product,
  initialTradeId,
  initialPaid = false,
}: Props) {
  const nav = useNavigate();
  const { me } = useAuth();

  const [activeTab, setActiveTab] = useState<TradeTab>("DELIVERY");
  const [selectedOptionId, setSelectedOptionId] =
    useState<TradeTab>("DELIVERY");
  const [submitting, setSubmitting] = useState(false);

  const [progressMode, setProgressMode] = useState(false);
  const [currentTradeId, setCurrentTradeId] = useState<number | null>(null);
  const [currentTradeType, setCurrentTradeType] =
    useState<ProgressTradeType | null>(null);

  const options = useMemo(() => OPTIONS[activeTab], [activeTab]);

  useEffect(() => {
    if (!initialTradeId || Number.isNaN(initialTradeId)) return;

    setCurrentTradeId(initialTradeId);
    setCurrentTradeType(toProgressTradeType(activeTab));
    setProgressMode(true);
  }, [initialTradeId, activeTab]);

  const handleClose = () => {
    setProgressMode(false);
    setCurrentTradeId(null);
    setCurrentTradeType(null);
    onClose();
  };

  const handleBackToMethod = () => {
    setProgressMode(false);
    setCurrentTradeId(null);
    setCurrentTradeType(null);
    nav(`/product/${product.productId}/trade`);
  };

  const handleChangeTab = (tab: TradeTab) => {
    setActiveTab(tab);
    setSelectedOptionId(tab);
  };

  const requestTossPayment = async (accessToken: string, tradeId: number) => {
    await tradeApi.createPayment(accessToken, {
      PRODUCT_ID: product.productId,
      TRADE_ID: tradeId,
    });

    await loadTossScript();

    const orderId = nanoid();
    const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);

    await tossPayments.requestPayment("카드", {
      amount: product.expectedPrice,
      orderId,
      orderName: product.title,
      customerName: getNickname(me),
      successUrl: `${window.location.origin}/product/${product.productId}/trade/${tradeId}?payment=success`,
      failUrl: `${window.location.origin}/product/${product.productId}/trade/${tradeId}?payment=fail`,
    });
  };

  const handleBuyClick = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    if (activeTab === "LOCKER") {
      message.info("보관함 거래는 추후 지원 예정입니다.");
      return;
    }

    try {
      setSubmitting(true);

      const tradeIdRes = await tradeApi.getTradeId(
        accessToken,
        product.productId,
      );

      let tradeId = Array.isArray(tradeIdRes)
        ? tradeIdRes[0]?.TRADE_ID
        : tradeIdRes?.TRADE_ID;

      if (!tradeId) {
        const createRes = await tradeApi.createTrade(accessToken, {
          PRODUCT_ID: product.productId,
          TRADE_TYPE_CODE: activeTab,
          CHAT_ROOM_ID: 0,
          TRADE_ID: 0,
        });

        tradeId = Number(createRes);
      }

      if (!tradeId || Number.isNaN(Number(tradeId))) {
        message.error("거래 ID를 확인할 수 없습니다.");
        return;
      }

      const numericTradeId = Number(tradeId);

      if (activeTab === "DELIVERY") {
        await requestTossPayment(accessToken, numericTradeId);
        return;
      }

      setCurrentTradeId(numericTradeId);
      setCurrentTradeType("DIRECT");
      setProgressMode(true);

      nav(`/product/${product.productId}/trade/${numericTradeId}`);
    } catch (error) {
      console.error(error);
      message.error("거래 진행 화면으로 이동할 수 없습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      placement="right"
      width={520}
      closable={false}
      destroyOnClose
      className={styles.drawer}
      styles={{ body: { padding: 0 } }}
    >
      {progressMode && currentTradeId && currentTradeType ? (
        <TradeProgressView
          tradeId={currentTradeId}
          tradeType={currentTradeType}
          product={product}
          initialPaid={initialPaid}
          onBack={handleBackToMethod}
          onClose={handleClose}
        />
      ) : (
        <DrawerLayout
          title="거래 방법 선택"
          onBack={handleClose}
          mainClassName={styles.layoutMain}
          footer={
            <div className={styles.bottomArea}>
              <div className={styles.summarySection}>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className={styles.productImage}
                  />
                ) : (
                  <div className={styles.productImageEmpty}>이미지 없음</div>
                )}

                <div className={styles.summaryTextArea}>
                  <div className={styles.productTitle}>{product.title}</div>

                  <div className={styles.priceRow}>
                    <span className={styles.priceLabel}>결제금액</span>
                    <span className={styles.priceValue}>
                      {formatPrice(product.expectedPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                className={styles.buyButton}
                loading={submitting}
                onClick={handleBuyClick}
              >
                구매하기
              </Button>
            </div>
          }
        >
          <section className={styles.tabSection}>
            {(["DELIVERY", "DIRECT", "LOCKER"] as TradeTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tabButton} ${
                  activeTab === tab ? styles.tabButtonActive : ""
                }`}
                onClick={() => handleChangeTab(tab)}
              >
                {tab === "DELIVERY"
                  ? "택배거래"
                  : tab === "DIRECT"
                    ? "직거래"
                    : "보관함거래"}
              </button>
            ))}
          </section>

          <section className={styles.optionList}>
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.optionCard} ${
                  selectedOptionId === option.id
                    ? styles.optionCardSelected
                    : ""
                }`}
                onClick={() => setSelectedOptionId(option.id)}
              >
                <div>
                  <div className={styles.optionTitle}>{option.title}</div>
                  <div className={styles.optionDescription}>
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </section>
        </DrawerLayout>
      )}
    </Drawer>
  );
}
