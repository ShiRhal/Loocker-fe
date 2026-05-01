import { useMemo, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import { tradeApi } from "../api/tradeApi";
import type { ProductTradePreview, TradeTab } from "../types/trade.types";
import styles from "./TradeProgressView.module.css";

type Step = {
  title: string;
  description: string;
};

type Props = {
  tradeId: number;
  tradeType: Exclude<TradeTab, "LOCKER">;
  product: ProductTradePreview;
  onBack: () => void;
  onClose: () => void;
  initialPaid?: boolean;
};

const directSteps: Step[] = [
  {
    title: "주문 확인",
    description: "거래 요청이 완료되었습니다.",
  },
  {
    title: "직거래 진행중",
    description: "판매자와 약속한 장소에서 상품을 확인해주세요.",
  },
  {
    title: "수령 완료",
    description: "상품을 정상적으로 수령했다면 완료 처리해주세요.",
  },
  {
    title: "거래 완료",
    description: "거래완료. 구매내역에 추가됩니다.",
  },
];

const deliverySteps: Step[] = [
  {
    title: "결제 완료",
    description: "결제가 정상적으로 완료되었습니다.",
  },
  {
    title: "주문 확인",
    description: "판매자가 주문 내용을 확인 중입니다.",
  },
  {
    title: "배송중",
    description: "상품이 배송 중입니다.",
  },
  {
    title: "배송 완료",
    description: "상품 배송이 완료되었습니다.",
  },
  {
    title: "구매 완료",
    description: "상품 수령 후 구매완료를 진행해주세요.",
  },
  {
    title: "거래 완료",
    description: "거래완료. 구매내역에 추가됩니다.",
  },
];

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function getStatusCode(result: unknown) {
  if (typeof result === "string") return result;
  if (typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;
    return String(
      obj.STATUS_CODE ?? obj.statusCode ?? obj.NEXT_STATUS_CODE ?? "",
    );
  }
  return "";
}

export default function TradeProgressView({
  tradeId,
  tradeType,
  product,
  onBack,
  onClose,
}: Props) {
  const nav = useNavigate();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(() => {
    return tradeType === "DELIVERY" ? deliverySteps : directSteps;
  }, [tradeType]);

  const lastIndex = steps.length - 1;
  const completeRequestIndex = steps.length - 2;
  const isCompleteStep = currentStepIndex === lastIndex;
  const isCompleteRequestStep = currentStepIndex === completeRequestIndex;

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex >= completeRequestIndex) return;
    setCurrentStepIndex((prev) => prev + 1);
  };

  const handleCancel = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    try {
      setSubmitting(true);

      await tradeApi.updateTradeStatus(accessToken, {
        TRADE_ID: tradeId,
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

  const handleComplete = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await tradeApi.updateTradeStatus(accessToken, {
        TRADE_ID: tradeId,
        NEXT_STATUS_CODE: "COMPLETED",
        TRADE_TYPE_CODE: tradeType,
      });

      const statusCode = getStatusCode(result);

      if (statusCode === "COMPLETED" || statusCode === "TR_02" || !statusCode) {
        setCurrentStepIndex(lastIndex);
        message.success("거래가 완료되었습니다.");
        return;
      }

      message.error("거래 완료 상태를 확인할 수 없습니다.");
    } catch (error) {
      console.error(error);
      message.error("거래 완료 처리에 실패했습니다.");
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

    if (isCompleteRequestStep) {
      handleComplete();
      return;
    }

    handleNext();
  };

  const buttonText = isCompleteStep
    ? "확인"
    : isCompleteRequestStep
      ? tradeType === "DIRECT"
        ? "수령 완료"
        : "구매 완료"
      : "다음 단계";

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
            {submitting ? "처리중..." : buttonText}
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
          <span className={styles.tradeBadge}>
            {tradeType === "DIRECT" ? "직거래" : "택배거래"}
          </span>
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
                key={`${step.title}-${index}`}
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
