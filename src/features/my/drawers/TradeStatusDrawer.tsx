import React, { useEffect, useMemo, useState } from "react";
import styles from "./TradeStatusDrawer.module.css";
import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import TradeProgressView from "../../trade/components/TradeProgressView";
import { tradeApi } from "../../trade/api/tradeApi";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";
import type {
  ProductTradePreview,
  TradeTab,
} from "../../trade/types/trade.types";
import type { UserInfoTrade, UserTradeRole } from "../api/userInfoApi";

interface TradeStatusDrawerProps {
  onClose: () => void;
  tradeList?: UserInfoTrade[];
}

type Step = {
  title: string;
  statusCode: string;
};

const POLLING_INTERVAL_MS = 5500;

const DIRECT_STEPS: Step[] = [
  { title: "주문 확인", statusCode: "TRADING" },
  { title: "직거래 진행중", statusCode: "DIRECT_IN_PROGRESS" },
  { title: "수령 완료", statusCode: "DIRECT_RECEIVED" },
  { title: "거래 완료", statusCode: "COMPLETED" },
];

const DELIVERY_STEPS: Step[] = [
  { title: "결제 완료", statusCode: "PAID" },
  { title: "주문 확인", statusCode: "ORDER_CHECK" },
  { title: "배송중", statusCode: "SHIPPING" },
  { title: "배송 완료", statusCode: "DELIVERED" },
  { title: "수령 완료", statusCode: "PICKEDUP" },
  { title: "거래 완료", statusCode: "COMPLETED" },
];

const LOCKER_STEPS: Step[] = [
  { title: "지점 선택", statusCode: "BRANCH_SELECT" },
  { title: "지점 확정", statusCode: "BRANCH_SELECTED" },
  { title: "입고 대기", statusCode: "DEPOSIT_WAITING" },
  { title: "입고 완료", statusCode: "DEPOSITED" },
  { title: "결제 완료", statusCode: "PAID" },
  { title: "수령 완료", statusCode: "PICKEDUP" },
  { title: "거래 완료", statusCode: "COMPLETED" },
];

const statusAliasMap: Record<string, string> = {
  TR_01: "TRADING",
  TR_02: "COMPLETED",
  TR_03: "CANCELED",
  TR_04: "PAID",
  TR_05: "FAILED",
  TR_06: "DEPOSITED",
  TR_07: "RETURED",
  TR_08: "PICKEDUP",
  TR_09: "DISPUTED",
  TR_10: "ORDER_CHECK",
  TR_11: "SHIPPING",
  TR_12: "DELIVERED",
  TR_13: "DIRECT_IN_PROGRESS",
  TR_14: "DIRECT_RECEIVED",
  TR_15: "BRANCH_SELECTED",
  TR_16: "DEPOSIT_WAITING",

  CANCELD: "CANCELED",
  RETURNED: "RETURED",
  RETURED: "RETURED",
  SELLER_DEPOSITED: "DEPOSITED",
};

function normalizeStatusCode(statusCode?: string | null, tradeType?: TradeTab) {
  if (!statusCode) return "";

  const code = String(statusCode).trim();
  const normalized = statusAliasMap[code] ?? code;

  if (tradeType === "LOCKER" && normalized === "TRADING") {
    return "BRANCH_SELECT";
  }

  return normalized;
}

function getTradeLabel(tradeType: TradeTab) {
  if (tradeType === "DIRECT") return "직거래";
  if (tradeType === "DELIVERY") return "택배거래";
  return "보관함거래";
}

function getSteps(tradeType: TradeTab) {
  if (tradeType === "DELIVERY") return DELIVERY_STEPS;
  if (tradeType === "LOCKER") return LOCKER_STEPS;
  return DIRECT_STEPS;
}

function getCurrentStepIndex(statusCode: string, tradeType: TradeTab) {
  const steps = getSteps(tradeType);
  const normalizedStatusCode = normalizeStatusCode(statusCode, tradeType);

  const index = steps.findIndex(
    (step) => step.statusCode === normalizedStatusCode,
  );

  return index >= 0 ? index : 0;
}

function getTradeDetailStatusCode(result: unknown, tradeType: TradeTab) {
  if (!result) return "";

  const data = Array.isArray(result) ? result[0] : result;

  if (!data || typeof data !== "object") return "";

  const obj = data as Record<string, unknown>;

  return normalizeStatusCode(
    String(
      obj.STATUS_CODE ??
        obj.RESULT_STATUS_CODE ??
        obj.NEXT_STATUS_CODE ??
        obj.statusCode ??
        "",
    ),
    tradeType,
  );
}

function getTradeDetailTradeId(result: unknown) {
  if (!result) return 0;

  const data = Array.isArray(result) ? result[0] : result;

  if (!data || typeof data !== "object") return 0;

  const obj = data as Record<string, unknown>;

  return Number(obj.TRADE_ID ?? obj.tradeId ?? 0);
}

function formatPrice(value: number) {
  return `${Number(value ?? 0).toLocaleString()}원`;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}. ${String(date.getDate()).padStart(2, "0")}.`;
}

function toProductTradePreview(item: UserInfoTrade): ProductTradePreview {
  return {
    productId: item.PRODUCT_ID,
    title: item.TITLE,
    imageUrl: item.IMAGE_URL ? toApiAssetUrl(item.IMAGE_URL) : "",
    expectedPrice: item.BASE_PRICE,
    tradeType: item.TRADE_TYPE_CODE,
  };
}

const TradeStatusDrawer: React.FC<TradeStatusDrawerProps> = ({
  onClose,
  tradeList = [],
}) => {
  const [keyword, setKeyword] = useState("");
  const [activeRole, setActiveRole] = useState<UserTradeRole>("BUYER");
  const [selectedTrade, setSelectedTrade] = useState<UserInfoTrade | null>(
    null,
  );
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});

  useEffect(() => {
    setStatusMap((prev) => {
      const next = { ...prev };
      let changed = false;

      tradeList.forEach((item) => {
        const statusCode = normalizeStatusCode(
          item.STATUS_CODE,
          item.TRADE_TYPE_CODE,
        );

        if (!statusCode) return;

        if (next[item.TRADE_ID] !== statusCode) {
          next[item.TRADE_ID] = statusCode;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [tradeList]);

  useEffect(() => {
    if (selectedTrade) return;
    if (!tradeList || tradeList.length === 0) return;

    const deliveryTradeList = tradeList.filter(
      (item) => item.TRADE_TYPE_CODE === "DELIVERY",
    );

    if (deliveryTradeList.length === 0) return;

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) return;

    let stopped = false;

    const syncDeliveryTradeStatuses = async () => {
      try {
        const results = await Promise.all(
          deliveryTradeList.map(async (item) => {
            try {
              const tradeDetail = await tradeApi.getTradeDetail(
                accessToken,
                item.PRODUCT_ID,
              );

              const tradeId = getTradeDetailTradeId(tradeDetail);

              if (tradeId !== item.TRADE_ID) {
                return null;
              }

              const statusCode = getTradeDetailStatusCode(
                tradeDetail,
                item.TRADE_TYPE_CODE,
              );

              if (!statusCode) return null;

              return {
                tradeId: item.TRADE_ID,
                statusCode,
              };
            } catch (error) {
              console.error(
                `택배거래 상태 동기화 실패. tradeId=${item.TRADE_ID}`,
                error,
              );

              return null;
            }
          }),
        );

        if (stopped) return;

        setStatusMap((prev) => {
          const next = { ...prev };
          let changed = false;

          results.forEach((result) => {
            if (!result) return;

            if (next[result.tradeId] !== result.statusCode) {
              next[result.tradeId] = result.statusCode;
              changed = true;
            }
          });

          return changed ? next : prev;
        });
      } catch (error) {
        console.error("택배거래 목록 상태 동기화 실패:", error);
      }
    };

    syncDeliveryTradeStatuses();

    const timerId = window.setInterval(
      syncDeliveryTradeStatuses,
      POLLING_INTERVAL_MS,
    );

    return () => {
      stopped = true;
      window.clearInterval(timerId);
    };
  }, [tradeList, selectedTrade]);

  const filteredTradeList = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return (tradeList ?? [])
      .filter((item) => item.MY_ROLE === activeRole)
      .filter((item) => {
        if (!normalizedKeyword) return true;
        return item.TITLE.toLowerCase().includes(normalizedKeyword);
      });
  }, [tradeList, activeRole, keyword]);

  const handleSelectedTradeStatusChange = (statusCode: string) => {
    if (!selectedTrade) return;

    const normalizedStatusCode = normalizeStatusCode(
      statusCode,
      selectedTrade.TRADE_TYPE_CODE,
    );

    if (!normalizedStatusCode) return;

    setStatusMap((prev) => ({
      ...prev,
      [selectedTrade.TRADE_ID]: normalizedStatusCode,
    }));

    setSelectedTrade((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        STATUS_CODE: normalizedStatusCode,
      };
    });
  };

  const handleSelectTrade = (item: UserInfoTrade) => {
    const normalizedStatusCode =
      statusMap[item.TRADE_ID] ??
      normalizeStatusCode(item.STATUS_CODE, item.TRADE_TYPE_CODE);

    setSelectedTrade({
      ...item,
      STATUS_CODE: normalizedStatusCode,
    });
  };

  if (selectedTrade) {
    const selectedStatusCode =
      statusMap[selectedTrade.TRADE_ID] ??
      normalizeStatusCode(
        selectedTrade.STATUS_CODE,
        selectedTrade.TRADE_TYPE_CODE,
      );

    return (
      <TradeProgressView
        tradeId={selectedTrade.TRADE_ID}
        tradeType={selectedTrade.TRADE_TYPE_CODE}
        product={toProductTradePreview(selectedTrade)}
        initialStatusCode={selectedStatusCode}
        onStatusChange={handleSelectedTradeStatusChange}
        onBack={() => setSelectedTrade(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <DrawerLayout
      title="거래 상태"
      onBack={onClose}
      mainClassName={styles.content}
    >
      <div className={styles.tabSection}>
        <button
          type="button"
          className={`${styles.tabButton} ${
            activeRole === "BUYER" ? styles.tabButtonActive : ""
          }`}
          onClick={() => setActiveRole("BUYER")}
        >
          구매중
        </button>

        <button
          type="button"
          className={`${styles.tabButton} ${
            activeRole === "SELLER" ? styles.tabButtonActive : ""
          }`}
          onClick={() => setActiveRole("SELLER")}
        >
          판매중
        </button>
      </div>

      <div className={styles.scrollArea}>
        <div className={styles.searchSection}>
          <form className={styles.search} onSubmit={(e) => e.preventDefault()}>
            <button type="submit" aria-label="검색">
              검색
            </button>

            <input
              id="keyword"
              type="search"
              autoComplete="off"
              className={styles.searchInput}
              placeholder="상품명을 입력해주세요"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </form>
        </div>

        <div className={styles.listContainer}>
          {filteredTradeList.length > 0 ? (
            <ul className={styles.productList}>
              {filteredTradeList.map((item) => {
                const imageUrl = item.IMAGE_URL
                  ? toApiAssetUrl(item.IMAGE_URL)
                  : "";

                const steps = getSteps(item.TRADE_TYPE_CODE);

                const currentStatusCode =
                  statusMap[item.TRADE_ID] ??
                  normalizeStatusCode(item.STATUS_CODE, item.TRADE_TYPE_CODE);

                const currentStepIndex = getCurrentStepIndex(
                  currentStatusCode,
                  item.TRADE_TYPE_CODE,
                );

                return (
                  <li key={item.TRADE_ID}>
                    <button
                      type="button"
                      className={styles.tradeCard}
                      onClick={() => handleSelectTrade(item)}
                    >
                      <div className={styles.productHeader}>
                        <div className={styles.imageBox}>
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.TITLE} />
                          ) : (
                            <span>이미지 없음</span>
                          )}
                        </div>

                        <div className={styles.infoBox}>
                          <div className={styles.badgeRow}>
                            <span className={styles.roleBadge}>
                              {item.MY_ROLE === "BUYER" ? "구매" : "판매"}
                            </span>
                            <span className={styles.tradeBadge}>
                              {getTradeLabel(item.TRADE_TYPE_CODE)}
                            </span>
                          </div>

                          <strong className={styles.productTitle}>
                            {item.TITLE}
                          </strong>
                          <span className={styles.nickname}>
                            {item.SELLER_NICKNAME}
                          </span>
                          <strong className={styles.price}>
                            {formatPrice(item.BASE_PRICE)}
                          </strong>
                        </div>

                        <div className={styles.sideInfo}>
                          <div className={styles.stats}>
                            <span className={styles.statItem}>
                              {item.VIEW_COUNT ?? 0}
                            </span>
                            <span className={styles.statItem}>
                              {item.CHAT_COUNT ?? 0}
                            </span>
                            <span className={styles.statItem}>
                              {item.WISH_COUNT ?? 0}
                            </span>
                          </div>

                          <span className={styles.createdAt}>
                            {formatDate(item.CREATED_AT)}
                          </span>
                        </div>
                      </div>

                      <div className={styles.progressBox}>
                        <div className={styles.progressHeader}>
                          <strong>거래 진행 상황</strong>
                          <span>
                            {currentStepIndex + 1} / {steps.length}
                          </span>
                        </div>

                        <ol className={styles.stepBar}>
                          {steps.map((step, index) => {
                            const isDone = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            const isActive = index <= currentStepIndex;

                            return (
                              <li
                                key={`${item.TRADE_ID}-${step.statusCode}`}
                                className={[
                                  styles.stepItem,
                                  isDone ? styles.stepDone : "",
                                  isCurrent ? styles.stepCurrent : "",
                                  isActive ? styles.stepActive : "",
                                ].join(" ")}
                              >
                                <div className={styles.stepCircle}>
                                  {isCurrent ? "✓" : index + 1}
                                </div>
                                <span className={styles.stepLabel}>
                                  {step.title}
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.emptyState}>
              <p>
                {activeRole === "BUYER"
                  ? "구매중인 거래가 없습니다."
                  : "판매중인 거래가 없습니다."}
              </p>
            </div>
          )}
        </div>
      </div>
    </DrawerLayout>
  );
};

export default TradeStatusDrawer;
