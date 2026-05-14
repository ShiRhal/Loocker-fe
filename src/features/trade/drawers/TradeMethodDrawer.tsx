import { useEffect, useMemo, useState } from "react";
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

type Props = {
  open: boolean;
  onClose: () => void;
  product: ProductTradePreview;
  initialTradeId?: number | null;
  initialPaid?: boolean;
};

const TOSS_CLIENT_KEY = "test_ck_QbgMGZzorzzY5z652y7Krl5E1em4";
const TOSS_SCRIPT_URL = "https://js.tosspayments.com/v1/payment";

const FRONT_BASE_URL =
  import.meta.env.VITE_FRONT_BASE_URL ?? window.location.origin;

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
      description: "스마트 보관함을 통해 비대면으로 거래합니다.",
    },
  ],
};

const PAID_OR_AFTER_STATUS_SET = new Set([
  "PAID",
  "ORDER_CHECK",
  "SHIPPING",
  "DELIVERED",
  "PICKEDUP",
  "COMPLETED",
]);

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function getNickname(me: unknown) {
  const user = me as Record<string, unknown> | null;

  return (
    String(
      user?.nickname ?? user?.NICKNAME ?? user?.USER_NICKNAME ?? "구매자",
    ).trim() || "구매자"
  );
}

function normalizeStatusCode(statusCode?: string | null) {
  if (!statusCode) return "";

  const code = String(statusCode).trim();

  const aliasMap: Record<string, string> = {
    TR_01: "TRADING",
    TR_02: "COMPLETED",
    TR_03: "CANCELED",
    TR_04: "PAID",
    TR_05: "FAILED",
    TR_08: "PICKEDUP",
    TR_10: "ORDER_CHECK",
    TR_11: "SHIPPING",
    TR_12: "DELIVERED",
    TR_13: "DIRECT_IN_PROGRESS",
    TR_14: "DIRECT_RECEIVED",
  };

  return aliasMap[code] ?? code;
}

function isPaidOrAfterStatus(statusCode?: string | null) {
  return PAID_OR_AFTER_STATUS_SET.has(normalizeStatusCode(statusCode));
}

function canOpenProgressDrawer(
  tradeType: TradeTab,
  statusCode?: string | null,
) {
  if (tradeType !== "DELIVERY") return true;

  return isPaidOrAfterStatus(statusCode);
}

function getCreatedTradeId(result: unknown) {
  if (typeof result === "number") return result;
  if (typeof result === "string") return Number(result);

  const data = Array.isArray(result) ? result[0] : result;

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    return Number(obj.TRADE_ID ?? obj.tradeId ?? obj.NEW_ID ?? 0);
  }

  return 0;
}

function getStatusCodeFromResponse(result: unknown) {
  if (typeof result === "string") {
    return normalizeStatusCode(result);
  }

  const data = Array.isArray(result) ? result[0] : result;

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;

    return normalizeStatusCode(
      String(
        obj.STATUS_CODE ??
          obj.statusCode ??
          obj.RESULT_STATUS_CODE ??
          obj.resultStatusCode ??
          obj.NEXT_STATUS_CODE ??
          obj.nextStatusCode ??
          "",
      ),
    );
  }

  return "";
}

function isTradeTab(value: string): value is TradeTab {
  return ["DELIVERY", "DIRECT", "LOCKER"].includes(value);
}

function getAvailableTabs(tradeType: string): TradeTab[] {
  const tabs = tradeType
    .split("|")
    .map((value) => value.trim())
    .filter(isTradeTab);

  return tabs.length > 0 ? tabs : ["DELIVERY", "DIRECT", "LOCKER"];
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
  const { me } = useAuth();

  const availableTabs = useMemo(
    () => getAvailableTabs(product.tradeType),
    [product.tradeType],
  );

  const [activeTab, setActiveTab] = useState<TradeTab>(availableTabs[0]);
  const [selectedOptionId, setSelectedOptionId] = useState<TradeTab>(
    availableTabs[0],
  );
  const [submitting, setSubmitting] = useState(false);

  const [progressMode, setProgressMode] = useState(false);
  const [currentTradeId, setCurrentTradeId] = useState<number | null>(null);
  const [currentTradeType, setCurrentTradeType] = useState<TradeTab | null>(
    null,
  );
  const [currentStatusCode, setCurrentStatusCode] = useState<string | null>(
    null,
  );

  const options = useMemo(() => OPTIONS[activeTab], [activeTab]);

  useEffect(() => {
    const defaultTab = availableTabs[0];

    setActiveTab(defaultTab);
    setSelectedOptionId(defaultTab);
  }, [availableTabs]);

  useEffect(() => {
    if (!open) {
      setProgressMode(false);
      setCurrentTradeId(null);
      setCurrentTradeType(null);
      setCurrentStatusCode(null);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !initialTradeId) return;

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    const restoreTradeProgress = async () => {
      try {
        setSubmitting(true);

        const tradeDetail = await tradeApi.getTradeDetail(
          accessToken,
          product.productId,
        );

        if (!tradeDetail || tradeDetail.TRADE_ID !== initialTradeId) {
          message.error("거래 정보를 확인할 수 없습니다.");
          return;
        }

        const normalizedStatusCode = normalizeStatusCode(
          tradeDetail.STATUS_CODE,
        );

        const statusCodeForProgress =
          initialPaid &&
          tradeDetail.TRADE_TYPE_CODE === "DELIVERY" &&
          !isPaidOrAfterStatus(normalizedStatusCode)
            ? "PAID"
            : normalizedStatusCode;

        setCurrentTradeId(tradeDetail.TRADE_ID);
        setCurrentTradeType(tradeDetail.TRADE_TYPE_CODE);
        setCurrentStatusCode(statusCodeForProgress);

        if (
          initialPaid ||
          canOpenProgressDrawer(
            tradeDetail.TRADE_TYPE_CODE,
            statusCodeForProgress,
          )
        ) {
          setProgressMode(true);
        }

        if (initialPaid) {
          message.success("결제가 완료되었습니다.");
        }
      } catch (error) {
        console.error(error);
        message.error("거래 정보를 불러오지 못했습니다.");
      } finally {
        setSubmitting(false);
      }
    };

    restoreTradeProgress();
  }, [open, initialTradeId, initialPaid, product.productId]);

  useEffect(() => {
    if (!open || initialTradeId) return;

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) return;

    const checkExistingTrade = async () => {
      try {
        setSubmitting(true);

        const tradeDetail = await tradeApi.getTradeDetail(
          accessToken,
          product.productId,
        );

        if (!tradeDetail) return;

        const normalizedStatusCode = normalizeStatusCode(
          tradeDetail.STATUS_CODE,
        );

        setCurrentTradeId(tradeDetail.TRADE_ID);
        setCurrentTradeType(tradeDetail.TRADE_TYPE_CODE);
        setCurrentStatusCode(normalizedStatusCode);

        if (
          canOpenProgressDrawer(
            tradeDetail.TRADE_TYPE_CODE,
            normalizedStatusCode,
          )
        ) {
          setProgressMode(true);
          return;
        }

        if (tradeDetail.TRADE_TYPE_CODE === "DELIVERY") {
          setActiveTab("DELIVERY");
          setSelectedOptionId("DELIVERY");
          setProgressMode(false);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setSubmitting(false);
      }
    };

    checkExistingTrade();
  }, [open, initialTradeId, product.productId]);

  const handleClose = () => {
    setProgressMode(false);
    setCurrentTradeId(null);
    setCurrentTradeType(null);
    setCurrentStatusCode(null);
    onClose();
  };

  const handleBackToMethod = () => {
    setProgressMode(false);
    setCurrentTradeId(null);
    setCurrentTradeType(null);
    setCurrentStatusCode(null);
  };

  const handleChangeTab = (tab: TradeTab) => {
    setActiveTab(tab);
    setSelectedOptionId(tab);
  };

  const requestTossPayment = async (
    accessToken: string,
    tradeId: number,
    options?: {
      skipCreatePayment?: boolean;
    },
  ) => {
    if (!options?.skipCreatePayment) {
      await tradeApi.createPayment(accessToken, {
        PRODUCT_ID: product.productId,
        TRADE_ID: tradeId,
      });
    }

    await loadTossScript();

    const orderId = nanoid();
    const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);

    sessionStorage.setItem(
      "pendingPayment",
      JSON.stringify({
        productId: product.productId,
        tradeId,
        amount: product.expectedPrice,
        orderId,
        createdAt: Date.now(),
      }),
    );

    try {
      await tossPayments.requestPayment("카드", {
        amount: product.expectedPrice,
        orderId,
        orderName: product.title,
        customerName: getNickname(me),
        successUrl: `${FRONT_BASE_URL}/product/${product.productId}?payment=success&tradeId=${tradeId}`,
        failUrl: `${FRONT_BASE_URL}/product/${product.productId}?payment=fail&tradeId=${tradeId}`,
      });
    } catch (error) {
      console.error(error);
      message.error("결제창이 닫혔거나 결제가 중단되었습니다.");
    }
  };

  const handleBuyClick = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    try {
      setSubmitting(true);

      const tradeDetail = await tradeApi.getTradeDetail(
        accessToken,
        product.productId,
      );

      if (tradeDetail) {
        const normalizedStatusCode = normalizeStatusCode(
          tradeDetail.STATUS_CODE,
        );

        if (
          tradeDetail.TRADE_TYPE_CODE === "DELIVERY" &&
          !isPaidOrAfterStatus(normalizedStatusCode)
        ) {
          message.info("완료되지 않은 결제가 있어 결제를 다시 진행합니다.");

          await requestTossPayment(accessToken, tradeDetail.TRADE_ID, {
            skipCreatePayment: true,
          });

          return;
        }

        message.info("이미 진행 중인 거래가 있습니다.");

        setCurrentTradeId(tradeDetail.TRADE_ID);
        setCurrentTradeType(tradeDetail.TRADE_TYPE_CODE);
        setCurrentStatusCode(normalizedStatusCode);
        setProgressMode(true);
        return;
      }

      const createRes = await tradeApi.createTrade(accessToken, {
        PRODUCT_ID: product.productId,
        TRADE_TYPE_CODE: activeTab,
        CHAT_ROOM_ID: 0,
        TRADE_ID: 0,
      });

      const tradeId = getCreatedTradeId(createRes);

      if (!tradeId || Number.isNaN(tradeId)) {
        message.error("거래 ID를 확인할 수 없습니다.");
        return;
      }

      if (activeTab === "DELIVERY") {
        await requestTossPayment(accessToken, tradeId);
        return;
      }

      setCurrentTradeId(tradeId);
      setCurrentTradeType(activeTab);
      setCurrentStatusCode(getStatusCodeFromResponse(createRes) || "TRADING");
      setProgressMode(true);
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
          initialStatusCode={currentStatusCode}
          onStatusChange={(statusCode) =>
            setCurrentStatusCode(normalizeStatusCode(statusCode))
          }
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
          {availableTabs.length > 1 && (
            <section className={styles.tabSection}>
              {availableTabs.map((tab) => (
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
          )}

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
