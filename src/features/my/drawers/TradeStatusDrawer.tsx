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
  { title: "입고 완료", statusCode: "SELLER_DEPOSITED" },
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
  TR_06: "BRANCH_SELECTED",
  TR_08: "PICKEDUP",
  TR_10: "ORDER_CHECK",
  TR_11: "SHIPPING",
  TR_12: "DELIVERED",
  TR_13: "DIRECT_IN_PROGRESS",
  TR_14: "DIRECT_RECEIVED",
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

function getTradeDetailMyRole(result: unknown) {
  if (!result) return "";

  const data = Array.isArray(result) ? result[0] : result;

  if (!data || typeof data !== "object") return "";

  const obj = data as Record<string, unknown>;

  return String(obj.MY_ROLE ?? obj.myRole ?? "");
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

  /**
   * 택배거래 목록 전용 polling
   *
   * DELIVERY는 백엔드 스케줄러가 상태를 자동으로 바꾸므로 목록에서도 polling 합니다.
   * DIRECT / LOCKER는 여기서 polling 하지 않습니다.
   * 상세 화면에 들어간 경우에는 TradeProgressView가 필요한 동작을 담당하므로 목록 polling을 멈춥니다.
   */
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

              const myRole = getTradeDetailMyRole(tradeDetail);

              return {
                tradeId: item.TRADE_ID,
                statusCode,
                myRole,
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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.0278 19.0556C14.3233 19.0556 17.8056 15.5733 17.8056 11.2778C17.8056 6.98223 14.3233 3.5 10.0278 3.5C5.73223 3.5 2.25 6.98223 2.25 11.2778C2.25 15.5733 5.73223 19.0556 10.0278 19.0556Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="transparent"
                />
                <path
                  d="M21 21.8999L15.5 16.8999"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
                      onClick={() => setSelectedTrade(item)}
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
                              <svg
                                className={styles.statIcon}
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path d="M12 5C6.5 5 2.3 9.1 1 12c1.3 2.9 5.5 7 11 7s9.7-4.1 11-7c-1.3-2.9-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.8a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" />
                              </svg>
                              {item.VIEW_COUNT ?? 0}
                            </span>

                            <span className={styles.statItem}>
                              <svg
                                className={styles.statIcon}
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4.5 4v-4.5A2.5 2.5 0 0 1 4 12.5z" />
                              </svg>
                              {item.CHAT_COUNT ?? 0}
                            </span>

                            <span className={styles.statItem}>
                              <svg
                                className={styles.statIcon}
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path d="M12 21s-6.716-4.35-9.193-8.077C.91 10.064 1.37 5.97 4.59 4.09c2.02-1.18 4.57-.78 6.41.9l1 0 1-1c1.84-1.68 4.39-2.08 6.41-.9 3.22 1.88 3.68 5.974 1.783 8.833C18.716 16.65 12 21 12 21z" />
                              </svg>
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
              <svg
                width="26"
                height="26"
                viewBox="0 0 26 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 3.5H7C6.46957 3.5 5.96086 3.70018 5.58579 4.0565C5.21071 4.41282 5 4.89609 5 5.4V20.6C5 21.1039 5.21071 21.5872 5.58579 21.9435C5.96086 22.2998 6.46957 22.5 7 22.5H19C19.5304 22.5 20.0391 22.2998 20.4142 21.9435C20.7893 21.5872 21 21.1039 21 20.6V9.2L15 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 4V9.5C15 9.77614 15.2239 10 15.5 10H21"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 14H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 18H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 10H10H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
