import { useMemo, useState } from "react";
import { Drawer, Button, message } from "antd";
import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import { tradeApi } from "../api/tradeApi";
import type {
  ProductTradePreview,
  TradeMethodOption,
  TradeTab,
} from "../types/trade.types";
import styles from "./TradeMethodDrawer.module.css";

type TradeMethodDrawerProps = {
  open: boolean;
  onClose: () => void;
  product: ProductTradePreview;
};

const DELIVERY_OPTIONS: TradeMethodOption[] = [
  {
    id: "delivery-normal",
    title: "일반 택배",
    description: "상품이 문 앞으로 도착해요.",
  },
];

const DIRECT_OPTIONS: TradeMethodOption[] = [
  {
    id: "direct-meet",
    title: "직거래",
    description: "판매자와 장소를 정해 직접 만나서 거래해요.",
  },
];

const LOCKER_OPTIONS: TradeMethodOption[] = [
  {
    id: "locker-basic",
    title: "보관함 거래",
    description: "보관함에 상품을 맡기고 상대방이 수령해요.",
  },
];

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

export default function TradeMethodDrawer({
  open,
  onClose,
  product,
}: TradeMethodDrawerProps) {
  const [activeTab, setActiveTab] = useState<TradeTab>("DELIVERY");
  const [selectedOptionId, setSelectedOptionId] =
    useState<string>("delivery-normal");
  const [submitting, setSubmitting] = useState(false);

  const options = useMemo(() => {
    if (activeTab === "DELIVERY") return DELIVERY_OPTIONS;
    if (activeTab === "DIRECT") return DIRECT_OPTIONS;
    return LOCKER_OPTIONS;
  }, [activeTab]);

  const handleChangeTab = (tab: TradeTab) => {
    setActiveTab(tab);

    if (tab === "DELIVERY") setSelectedOptionId("delivery-normal");
    if (tab === "DIRECT") setSelectedOptionId("direct-meet");
    if (tab === "LOCKER") setSelectedOptionId("locker-basic");
  };

  const handleBuyClick = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    let tradeTypeCode: "DELIVERY" | "DIRECT" | "LOCKER" = "DIRECT";

    try {
      setSubmitting(true);

      await tradeApi.createTrade(accessToken, {
        PRODUCT_ID: 5,
        TRADE_TYPE_CODE: "DIRECT",
        TRADE_ID: 0,
      });

      const payload = {
        PRODUCT_ID: 5,
        TRADE_TYPE_CODE: tradeTypeCode,
        TRADE_ID: 0,
      };
      console.log("accessToken =", accessToken);
      console.log("trade/create request body =", payload);
      console.log("Authorization token =", accessToken);

      message.success("거래 생성 요청이 전송되었습니다.");
    } catch (error) {
      console.error(error);
      message.error("거래 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width={520}
      closable={false}
      destroyOnClose
      className={styles.drawer}
      styles={{ body: { padding: 0 } }}
    >
      <DrawerLayout
        title="거래 방법 선택"
        onBack={onClose}
        mainClassName={styles.layoutMain}
        footer={
          <div className={styles.bottomArea}>
            <div className={styles.summarySection}>
              <img
                src={product.imageUrl}
                alt={product.title}
                className={styles.productImage}
              />

              <div className={styles.summaryTextArea}>
                <div className={styles.productTitle}>{product.title}</div>

                <div className={styles.priceRow}>
                  <span className={styles.priceLabel}>예상금액</span>
                  <span className={styles.priceValue}>
                    {formatPrice(product.expectedPrice)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={styles.foldButton}
                aria-label="요약 접기"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M3.525 6.41a.616.616 0 0 1 .857.027L10 12.292l5.618-5.855a.616.616 0 0 1 .857-.027.583.583 0 0 1 .028.837l-6.06 6.316a.613.613 0 0 1-.885 0l-6.06-6.316a.583.583 0 0 1 .027-.837"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            <div className={styles.footerButtonRow}>
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
          </div>
        }
      >
        <section className={styles.tabSection}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "DELIVERY" ? styles.tabButtonActive : ""}`}
            onClick={() => handleChangeTab("DELIVERY")}
          >
            택배거래
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "DIRECT" ? styles.tabButtonActive : ""}`}
            onClick={() => handleChangeTab("DIRECT")}
          >
            직거래
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "LOCKER" ? styles.tabButtonActive : ""}`}
            onClick={() => handleChangeTab("LOCKER")}
          >
            보관함거래
          </button>
        </section>

        <section className={styles.optionList}>
          {options.map((option) => {
            const selected = selectedOptionId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={`${styles.optionCard} ${selected ? styles.optionCardSelected : ""}`}
                onClick={() => setSelectedOptionId(option.id)}
              >
                <div className={styles.optionTextArea}>
                  <div className={styles.optionTitle}>{option.title}</div>
                  <div className={styles.optionDescription}>
                    {option.description}
                  </div>
                </div>

                {option.feeLabel ? (
                  <div className={styles.optionFeeBox}>
                    <span className={styles.optionFeeLabel}>
                      {option.feeLabel}
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </section>
      </DrawerLayout>
    </Drawer>
  );
}
