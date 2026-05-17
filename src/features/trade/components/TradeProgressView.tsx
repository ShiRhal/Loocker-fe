import { useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import { tradeApi } from "../api/tradeApi";
import LockerTradeProgressSection from "./LockerTradeProgressSection";
import type {
  ProductTradePreview,
  TradeRole,
  TradeTab,
} from "../types/trade.types";
import styles from "./TradeProgressView.module.css";

type Step = {
  title: string;
  description: string;
  statusCode: string;
};

type Props = {
  tradeId: number;
  tradeType: TradeTab;
  product: ProductTradePreview;
  onBack: () => void;
  onClose: () => void;
  initialStatusCode?: string | null;
  onStatusChange?: (statusCode: string) => void;
};

const POLLING_INTERVAL_MS = 5500;

const directSteps: Step[] = [
  {
    title: "주문 확인",
    description: "거래 요청이 완료되었습니다.",
    statusCode: "TRADING",
  },
  {
    title: "직거래 진행중",
    description: "판매자와 약속한 장소에서 상품을 확인해주세요.",
    statusCode: "DIRECT_IN_PROGRESS",
  },
  {
    title: "수령 완료",
    description: "상품을 정상적으로 수령했다면 완료 처리해주세요.",
    statusCode: "DIRECT_RECEIVED",
  },
  {
    title: "거래 완료",
    description: "거래완료. 구매내역에 추가됩니다.",
    statusCode: "COMPLETED",
  },
];

const deliverySteps: Step[] = [
  {
    title: "결제 완료",
    description: "결제가 정상적으로 완료되었습니다.",
    statusCode: "PAID",
  },
  {
    title: "주문 확인",
    description: "판매자가 주문 내용을 확인 중입니다.",
    statusCode: "ORDER_CHECK",
  },
  {
    title: "배송중",
    description: "상품이 배송 중입니다.",
    statusCode: "SHIPPING",
  },
  {
    title: "배송 완료",
    description: "상품 배송이 완료되었습니다.",
    statusCode: "DELIVERED",
  },
  {
    title: "수령 완료",
    description: "상품 수령 후 구매완료를 진행해주세요.",
    statusCode: "PICKEDUP",
  },
  {
    title: "거래 완료",
    description: "거래완료. 구매내역에 추가됩니다.",
    statusCode: "COMPLETED",
  },
];

const statusAliasMap: Record<string, string> = {
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

  CANCELD: "CANCELED",
  CANCELED: "CANCELED",
};

function formatPrice(value: number) {
  return `${Number(value ?? 0).toLocaleString()}원`;
}

function normalizeStatusCode(statusCode?: string | null) {
  if (!statusCode) return "";

  const code = String(statusCode).trim();

  return statusAliasMap[code] ?? code;
}

function getResponseStatusCode(result: unknown) {
  if (!result) return "";

  if (typeof result === "string") {
    return normalizeStatusCode(result);
  }

  const data = Array.isArray(result) ? result[0] : result;

  if (typeof data !== "object" || data === null) {
    return "";
  }

  const obj = data as Record<string, unknown>;

  return normalizeStatusCode(
    String(
      obj.RESULT_STATUS_CODE ??
        obj.STATUS_CODE ??
        obj.NEXT_STATUS_CODE ??
        obj.resultStatusCode ??
        obj.statusCode ??
        obj.nextStatusCode ??
        "",
    ),
  );
}

function getStepIndexByStatusCode(steps: Step[], statusCode: string) {
  const index = steps.findIndex((step) => step.statusCode === statusCode);

  return index >= 0 ? index : 0;
}

function getNextStatusCode(steps: Step[], currentStatusCode: string) {
  const currentIndex = getStepIndexByStatusCode(steps, currentStatusCode);

  if (currentIndex >= steps.length - 1) {
    return "";
  }

  return steps[currentIndex + 1].statusCode;
}

function getTradeLabel(tradeType: TradeTab) {
  if (tradeType === "DIRECT") return "직거래";
  if (tradeType === "DELIVERY") return "택배거래";
  return "보관함거래";
}

export default function TradeProgressView({
  tradeId,
  tradeType,
  product,
  onBack,
  onClose,
  initialStatusCode,
  onStatusChange,
}: Props) {
  if (tradeType === "LOCKER") {
    return (
      <LockerTradeProgressSection
        tradeId={tradeId}
        tradeType={tradeType}
        product={product}
        onBack={onBack}
        onClose={onClose}
        initialStatusCode={initialStatusCode}
        onStatusChange={onStatusChange}
      />
    );
  }

  const nav = useNavigate();
  const onStatusChangeRef = useRef(onStatusChange);

  const defaultStatusCode = tradeType === "DELIVERY" ? "PAID" : "TRADING";

  const [resolvedTradeId, setResolvedTradeId] = useState(tradeId);
  const [currentStatusCode, setCurrentStatusCode] = useState(() =>
    normalizeStatusCode(initialStatusCode ?? defaultStatusCode),
  );
  const [myRole, setMyRole] = useState<TradeRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(() => {
    if (tradeType === "DELIVERY") return deliverySteps;
    return directSteps;
  }, [tradeType]);

  useEffect(() => {
    setResolvedTradeId(tradeId);
  }, [tradeId]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    setCurrentStatusCode(
      normalizeStatusCode(initialStatusCode ?? defaultStatusCode),
    );
  }, [initialStatusCode, defaultStatusCode]);

  useEffect(() => {
    if (tradeType !== "DELIVERY") return;

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken || !product.productId) return;

    let stopped = false;

    const syncDeliveryTradeStatus = async () => {
      try {
        const tradeDetail = await tradeApi.getTradeDetail(
          accessToken,
          product.productId,
        );

        if (stopped || !tradeDetail) return;

        const detail = Array.isArray(tradeDetail)
          ? tradeDetail[0]
          : tradeDetail;

        if (!detail) return;

        if (resolvedTradeId && detail.TRADE_ID !== resolvedTradeId) return;

        setResolvedTradeId(detail.TRADE_ID);

        if (detail.MY_ROLE) {
          setMyRole(detail.MY_ROLE);
        }

        const latestStatusCode = normalizeStatusCode(
          detail.STATUS_CODE ??
            detail.RESULT_STATUS_CODE ??
            detail.NEXT_STATUS_CODE,
        );

        if (!latestStatusCode) return;

        setCurrentStatusCode((prev) => {
          if (prev === latestStatusCode) return prev;
          return latestStatusCode;
        });

        onStatusChangeRef.current?.(latestStatusCode);
      } catch (error) {
        console.error("택배거래 상태 동기화 실패:", error);
      }
    };

    syncDeliveryTradeStatus();

    const timerId = window.setInterval(
      syncDeliveryTradeStatus,
      POLLING_INTERVAL_MS,
    );

    return () => {
      stopped = true;
      window.clearInterval(timerId);
    };
  }, [resolvedTradeId, product.productId, tradeType]);

  const currentStepIndex = useMemo(() => {
    return getStepIndexByStatusCode(steps, currentStatusCode);
  }, [steps, currentStatusCode]);

  const lastIndex = steps.length - 1;
  const isCompleteStep = currentStepIndex === lastIndex;
  const currentStep = steps[currentStepIndex];
  const nextStatusCode = getNextStatusCode(steps, currentStatusCode);

  const handleCancel = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    try {
      setSubmitting(true);

      await tradeApi.updateTradeStatus(accessToken, {
        TRADE_ID: resolvedTradeId,
        RESULT_STATUS_CODE: currentStatusCode,
        NEXT_STATUS_CODE: "CANCELED",
        TRADE_TYPE_CODE: tradeType,
      });

      message.success("거래가 취소되었습니다.");
      onClose();
      nav(`/product/${product.productId}`);
    } catch (error) {
      console.error(error);
      message.error("거래 취소 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProgress = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    if (!nextStatusCode) {
      message.error("다음 거래 상태를 확인할 수 없습니다.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await tradeApi.updateTradeStatus(accessToken, {
        TRADE_ID: resolvedTradeId,
        RESULT_STATUS_CODE: currentStatusCode,
        NEXT_STATUS_CODE: nextStatusCode,
        TRADE_TYPE_CODE: tradeType,
      });

      const responseStatusCode = getResponseStatusCode(result);

      if (!responseStatusCode) {
        message.error("변경된 거래 상태를 확인할 수 없습니다.");
        return;
      }

      setCurrentStatusCode(responseStatusCode);
      onStatusChangeRef.current?.(responseStatusCode);

      if (responseStatusCode === "COMPLETED") {
        message.success("거래가 완료되었습니다.");
        return;
      }

      message.success("거래 상태가 변경되었습니다.");
    } catch (error) {
      console.error(error);
      message.error("거래 상태 변경에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMainButtonClick = () => {
    if (isCompleteStep) {
      onClose();
      nav(`/product/${product.productId}`);
      return;
    }

    handleProgress();
  };

  const getButtonText = () => {
    if (isCompleteStep) return "확인";

    return steps[currentStepIndex + 1]?.title ?? "다음 단계";
  };

  return (
    <DrawerLayout
      title="거래 진행"
      onBack={onBack}
      mainClassName={styles.main}
      footer={
        <div className={styles.footerButtonRow}>
          <button
            type="button"
            className={styles.subButton}
            onClick={handleCancel}
            disabled={submitting || isCompleteStep}
          >
            거래 취소하기
          </button>

          <button
            type="button"
            className={styles.mainButton}
            onClick={handleMainButtonClick}
            disabled={submitting}
          >
            {submitting ? "처리중..." : getButtonText()}
          </button>
        </div>
      }
    >
      <section className={styles.productCard}>
        <div className={styles.imageBox}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.title} />
          ) : (
            <div className={styles.noImage}>이미지 없음</div>
          )}
        </div>

        <div className={styles.productInfo}>
          <span className={styles.tradeBadge}>{getTradeLabel(tradeType)}</span>
          <h2>{product.title}</h2>
          <strong>{formatPrice(product.expectedPrice)}</strong>
        </div>
      </section>

      <section className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <h3>거래 진행 상황</h3>
          <p>
            {currentStepIndex + 1} / {steps.length}
          </p>
        </div>

        <ol className={styles.stepBar}>
          {steps.map((step, index) => {
            const isDone = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isActive = index <= currentStepIndex;

            return (
              <li
                key={step.statusCode}
                className={[
                  styles.stepItem,
                  isDone ? styles.done : "",
                  isCurrent ? styles.current : "",
                  isActive ? styles.active : "",
                ].join(" ")}
              >
                <div className={styles.stepCircle}>
                  {isCurrent ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <div className={styles.stepLabel}>{step.title}</div>

                {isCurrent && <div className={styles.statusBadge}>진행중</div>}
              </li>
            );
          })}
        </ol>

        <div className={styles.descriptionBox}>
          <div className={styles.descriptionIcon}>✓</div>
          <div>
            <h4>{currentStep.title}</h4>
            <p>{currentStep.description}</p>
          </div>
        </div>
      </section>
    </DrawerLayout>
  );
}
