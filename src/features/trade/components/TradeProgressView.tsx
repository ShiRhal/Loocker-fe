import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import { tradeApi } from "../api/tradeApi";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";
import LockerMapDrawer from "./LockerMapDrawer";
import type {
  ProductTradePreview,
  TradeLockerLocationResponse,
  TradeLockerStateResponse,
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

const lockerSteps: Step[] = [
  {
    title: "지점 선택",
    description: "판매자가 상품을 입고할 보관함 지점을 선택합니다.",
    statusCode: "BRANCH_SELECT",
  },
  {
    title: "지점 확정",
    description: "선택한 보관함 지점을 확인하고 입고 대기 단계로 진행합니다.",
    statusCode: "BRANCH_SELECTED",
  },
  {
    title: "입고 대기",
    description:
      "판매자가 키오스크에서 본인 인증 후 상품을 보관함에 입고합니다.",
    statusCode: "DEPOSIT_WAITING",
  },
  {
    title: "입고 완료",
    description: "판매자가 상품을 보관함에 입고했습니다.",
    statusCode: "SELLER_DEPOSITED",
  },
  {
    title: "결제 완료",
    description: "구매자가 상품 확인 후 결제를 완료했습니다.",
    statusCode: "PAID",
  },
  {
    title: "수령 완료",
    description: "구매자가 보관함에서 상품을 수령했습니다.",
    statusCode: "PICKEDUP",
  },
  {
    title: "거래 완료",
    description: "보관함 거래가 완료되었습니다.",
    statusCode: "COMPLETED",
  },
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

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`;
}

function normalizeBaseStatusCode(statusCode?: string | null) {
  if (!statusCode) return "";

  const code = String(statusCode).trim();

  return statusAliasMap[code] ?? code;
}

function normalizeTradeStatusCode(
  statusCode: string | null | undefined,
  tradeType: TradeTab,
) {
  const normalized = normalizeBaseStatusCode(statusCode);

  if (tradeType === "LOCKER" && normalized === "TRADING") {
    return "BRANCH_SELECT";
  }

  return normalized;
}

function getResponseStatusCode(result: unknown, tradeType: TradeTab) {
  if (!result) return "";

  if (typeof result === "string") {
    return normalizeTradeStatusCode(result, tradeType);
  }

  const data = Array.isArray(result) ? result[0] : result;

  if (typeof data !== "object" || data === null) {
    return "";
  }

  const obj = data as Record<string, unknown>;

  return normalizeTradeStatusCode(
    String(
      obj.RESULT_STATUS_CODE ??
        obj.STATUS_CODE ??
        obj.NEXT_STATUS_CODE ??
        obj.resultStatusCode ??
        obj.statusCode ??
        obj.nextStatusCode ??
        "",
    ),
    tradeType,
  );
}

function getTradeIdValue(result: unknown) {
  if (!result) return 0;

  if (typeof result === "number") return result;

  if (typeof result === "string") {
    const value = Number(result);
    return Number.isNaN(value) ? 0 : value;
  }

  const data = Array.isArray(result) ? result[0] : result;

  if (typeof data !== "object" || data === null) return 0;

  const obj = data as Record<string, unknown>;

  return Number(obj.TRADE_ID ?? obj.tradeId ?? obj.TRADE_ID_OUT ?? 0);
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

function getVisibleSteps(
  steps: Step[],
  currentIndex: number,
  tradeType: TradeTab,
) {
  if (tradeType !== "LOCKER") return steps;

  if (currentIndex <= 2) {
    return steps.slice(0, 5);
  }

  return steps.slice(currentIndex - 2, currentIndex + 3);
}

function getLockerStatusLabel(status?: string) {
  switch (status) {
    case "AVAILABLE":
    case "EMPTY":
    case "LO_01":
      return "비어있음";
    case "IN_USE":
      return "사용 중";
    case "BROKEN":
      return "고장";
    default:
      return status || "상태 미확인";
  }
}

function getBranchStatusLabel(status?: string) {
  switch (status) {
    case "ACTIVE":
      return "운영중";
    case "INACTIVE":
      return "운영중지";
    default:
      return status || "상태 미확인";
  }
}

function getLocationImageSrc(src?: string | null) {
  return toApiAssetUrl(src);
}

type ChatDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  if (!open) return null;

  return (
    <aside className={styles.leftDrawer}>
      <div className={styles.mapDrawerHeader}>
        <div>
          <h2 className={styles.mapDrawerTitle}>채팅하기</h2>
        </div>

        <button
          type="button"
          className={styles.mapCloseButton}
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className={styles.chatPlaceholder}>
        기존 채팅방 연결 예정 영역입니다.
      </div>
    </aside>
  );
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
  const nav = useNavigate();
  const onStatusChangeRef = useRef(onStatusChange);

  const defaultStatusCode =
    tradeType === "DELIVERY"
      ? "PAID"
      : tradeType === "LOCKER"
        ? "BRANCH_SELECT"
        : "TRADING";

  const [resolvedTradeId, setResolvedTradeId] = useState(tradeId);
  const [currentStatusCode, setCurrentStatusCode] = useState(() =>
    normalizeTradeStatusCode(initialStatusCode ?? defaultStatusCode, tradeType),
  );
  const [myRole, setMyRole] = useState<TradeRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [mapDrawerOpen, setMapDrawerOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  const [selectedLocation, setSelectedLocation] =
    useState<TradeLockerLocationResponse | null>(null);
  const [lockerStates, setLockerStates] = useState<TradeLockerStateResponse[]>(
    [],
  );
  const [lockerStateLoading, setLockerStateLoading] = useState(false);

  const [hasSavedLockerLocation, setHasSavedLockerLocation] = useState(false);

  const steps = useMemo(() => {
    if (tradeType === "DELIVERY") return deliverySteps;
    if (tradeType === "LOCKER") return lockerSteps;
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
      normalizeTradeStatusCode(
        initialStatusCode ?? defaultStatusCode,
        tradeType,
      ),
    );
  }, [initialStatusCode, defaultStatusCode, tradeType]);

  const resolveTradeId = useCallback(async () => {
    if (resolvedTradeId && resolvedTradeId > 0) {
      return resolvedTradeId;
    }

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return 0;
    }

    try {
      const result = await tradeApi.getTradeId(accessToken, product.productId);
      const nextTradeId = getTradeIdValue(result);

      if (!nextTradeId) {
        message.error("거래 ID를 확인할 수 없습니다.");
        return 0;
      }

      setResolvedTradeId(nextTradeId);

      return nextTradeId;
    } catch (error) {
      console.error(error);
      message.error("거래 ID 조회에 실패했습니다.");
      return 0;
    }
  }, [resolvedTradeId, product.productId]);

  const fetchLockerLocationAndStates = useCallback(async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken || tradeType !== "LOCKER") return;

    const targetTradeId = await resolveTradeId();

    if (!targetTradeId) return;

    try {
      const locations = await tradeApi.getTradeLockerLocation(accessToken, {
        TRADE_ID: targetTradeId,
        USER_ID: 0,
      });

      const location = Array.isArray(locations) ? locations[0] : null;

      if (!location?.KIOSK_ID) {
        setSelectedLocation(null);
        setLockerStates([]);
        setHasSavedLockerLocation(false);
        return;
      }

      setSelectedLocation(location);
      setHasSavedLockerLocation(true);

      const states = await tradeApi.getTradeLockerStateList(accessToken, {
        KIOSK_ID: location.KIOSK_ID,
      });

      setLockerStates(Array.isArray(states) ? states : []);
    } catch (error) {
      console.error("보관함 지점/상태 조회 실패:", error);
      setSelectedLocation(null);
      setLockerStates([]);
      setHasSavedLockerLocation(false);
    }
  }, [tradeType, resolveTradeId]);

  /**
   * 택배거래 전용 polling
   *
   * DELIVERY는 백엔드 스케줄러가 ORDER_CHECK → SHIPPING → DELIVERED → PICKEDUP으로
   * 상태를 자동 변경하므로 프론트에서 5.5초마다 상태를 다시 조회합니다.
   *
   * LOCKER / DIRECT에서는 이 polling을 절대 돌리지 않습니다.
   * 그래서 보관함 거래에서 select?PRODUCT_ID=... 요청이 반복 호출되지 않습니다.
   */
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

        if (stopped) return;
        if (!tradeDetail) return;

        const detail = Array.isArray(tradeDetail)
          ? tradeDetail[0]
          : tradeDetail;

        if (!detail) return;

        if (resolvedTradeId && detail.TRADE_ID !== resolvedTradeId) return;

        setResolvedTradeId(detail.TRADE_ID);

        const latestStatusCode = normalizeTradeStatusCode(
          detail.STATUS_CODE ??
            detail.RESULT_STATUS_CODE ??
            detail.NEXT_STATUS_CODE,
          tradeType,
        );

        if (detail.MY_ROLE) {
          setMyRole(detail.MY_ROLE);
        }

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

  useEffect(() => {
    if (tradeType !== "LOCKER") return;

    if (
      currentStatusCode === "BRANCH_SELECTED" ||
      currentStatusCode === "DEPOSIT_WAITING" ||
      currentStatusCode === "SELLER_DEPOSITED" ||
      currentStatusCode === "PAID" ||
      currentStatusCode === "PICKEDUP" ||
      currentStatusCode === "COMPLETED"
    ) {
      fetchLockerLocationAndStates();
    }
  }, [tradeType, currentStatusCode, fetchLockerLocationAndStates]);

  const currentStepIndex = useMemo(() => {
    return getStepIndexByStatusCode(steps, currentStatusCode);
  }, [steps, currentStatusCode]);

  const visibleSteps = useMemo(() => {
    return getVisibleSteps(steps, currentStepIndex, tradeType);
  }, [steps, currentStepIndex, tradeType]);

  const lastIndex = steps.length - 1;
  const isCompleteStep = currentStepIndex === lastIndex;

  const currentStep = steps[currentStepIndex];
  const nextStatusCode = getNextStatusCode(steps, currentStatusCode);

  const isLocker = tradeType === "LOCKER";
  const isSeller = myRole === "SELLER" || myRole === null;

  const isLockerBranchSelectStep =
    isLocker && currentStatusCode === "BRANCH_SELECT";
  const isLockerBranchConfirmStep =
    isLocker && currentStatusCode === "BRANCH_SELECTED";
  const isLockerDepositWaitingStep =
    isLocker && currentStatusCode === "DEPOSIT_WAITING";

  const refreshLockerStates = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    if (!selectedLocation?.KIOSK_ID) {
      message.error("선택된 보관함 지점이 없습니다.");
      return;
    }

    try {
      setLockerStateLoading(true);

      const states = await tradeApi.getTradeLockerStateList(accessToken, {
        KIOSK_ID: selectedLocation.KIOSK_ID,
      });

      setLockerStates(Array.isArray(states) ? states : []);
      message.success("보관함 상태를 새로고침했습니다.");
    } catch (error) {
      console.error(error);
      message.error("보관함 상태 새로고침에 실패했습니다.");
    } finally {
      setLockerStateLoading(false);
    }
  };

  const saveLockerLocation = async (
    accessToken: string,
    targetTradeId: number,
    mode: "create" | "update",
  ) => {
    if (!selectedLocation?.KIOSK_ID) {
      throw new Error("선택된 보관함 지점이 없습니다.");
    }

    const body = {
      TRADE_ID: targetTradeId,
      KIOSK_ID: selectedLocation.KIOSK_ID,
      USER_ID: 0,
    };

    if (mode === "create") {
      await tradeApi.createTradeLockerLocation(accessToken, body);
      return;
    }

    await tradeApi.updateTradeLockerLocation(accessToken, body);
  };

  const handleCancel = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    const targetTradeId = await resolveTradeId();

    if (!targetTradeId) return;

    try {
      setSubmitting(true);

      await tradeApi.updateTradeStatus(accessToken, {
        TRADE_ID: targetTradeId,
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

    const targetTradeId = await resolveTradeId();

    if (!targetTradeId) return;

    try {
      setSubmitting(true);

      const result = await tradeApi.updateTradeStatus(accessToken, {
        TRADE_ID: targetTradeId,
        RESULT_STATUS_CODE: currentStatusCode,
        NEXT_STATUS_CODE: nextStatusCode,
        TRADE_TYPE_CODE: tradeType,
      });

      const responseStatusCode = getResponseStatusCode(result, tradeType);

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

  const handleCreateBranchSelected = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    if (!selectedLocation?.KIOSK_ID) {
      message.error("먼저 보관함 지점을 선택해주세요.");
      return;
    }

    const targetTradeId = await resolveTradeId();

    if (!targetTradeId) return;

    try {
      setSubmitting(true);

      await saveLockerLocation(
        accessToken,
        targetTradeId,
        hasSavedLockerLocation ? "update" : "create",
      );

      const result = await tradeApi.updateTradeStatus(accessToken, {
        TRADE_ID: targetTradeId,
        RESULT_STATUS_CODE: "BRANCH_SELECT",
        NEXT_STATUS_CODE: "BRANCH_SELECTED",
        TRADE_TYPE_CODE: "LOCKER",
      });

      const responseStatusCode = getResponseStatusCode(result, tradeType);

      const nextUiStatusCode =
        responseStatusCode &&
        responseStatusCode !== "TRADING" &&
        responseStatusCode !== "BRANCH_SELECT"
          ? responseStatusCode
          : "BRANCH_SELECTED";

      setHasSavedLockerLocation(true);
      setCurrentStatusCode(nextUiStatusCode);
      onStatusChangeRef.current?.(nextUiStatusCode);

      message.success("지점이 확정되었습니다.");
    } catch (error) {
      console.error(error);
      message.error("지점 확정 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDepositWaiting = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    if (!selectedLocation?.KIOSK_ID) {
      message.error("먼저 보관함 지점을 선택해주세요.");
      return;
    }

    const targetTradeId = await resolveTradeId();

    if (!targetTradeId) return;

    try {
      setSubmitting(true);

      await saveLockerLocation(accessToken, targetTradeId, "update");

      const result = await tradeApi.updateTradeStatus(accessToken, {
        TRADE_ID: targetTradeId,
        RESULT_STATUS_CODE: "BRANCH_SELECTED",
        NEXT_STATUS_CODE: "DEPOSIT_WAITING",
        TRADE_TYPE_CODE: "LOCKER",
      });

      const responseStatusCode = getResponseStatusCode(result, tradeType);

      const nextUiStatusCode =
        responseStatusCode &&
        responseStatusCode !== "TRADING" &&
        responseStatusCode !== "BRANCH_SELECT" &&
        responseStatusCode !== "BRANCH_SELECTED"
          ? responseStatusCode
          : "DEPOSIT_WAITING";

      setHasSavedLockerLocation(true);
      setCurrentStatusCode(nextUiStatusCode);
      onStatusChangeRef.current?.(nextUiStatusCode);

      message.success("입고 대기 단계로 변경되었습니다.");
    } catch (error) {
      console.error(error);
      message.error("입고 대기 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMapDrawer = async () => {
    const targetTradeId = await resolveTradeId();

    if (!targetTradeId) return;

    setMapDrawerOpen(true);
    setChatDrawerOpen(false);
  };

  const handleMapLocationSelected = (
    location: TradeLockerLocationResponse,
    states: TradeLockerStateResponse[],
  ) => {
    setSelectedLocation(location);
    setLockerStates(states);

    if (currentStatusCode === "BRANCH_SELECT") {
      setHasSavedLockerLocation(false);
    }

    setMapDrawerOpen(false);
  };

  const handleMainButtonClick = () => {
    if (isCompleteStep) {
      onClose();
      nav(`/product/${product.productId}`);
      return;
    }

    if (isLockerBranchSelectStep) {
      handleCreateBranchSelected();
      return;
    }

    if (isLockerBranchConfirmStep) {
      handleConfirmDepositWaiting();
      return;
    }

    if (isLockerDepositWaitingStep) {
      message.info("키오스크에서 상품 입고가 완료되면 다음 단계로 진행됩니다.");
      return;
    }

    handleProgress();
  };

  const getButtonText = () => {
    if (isCompleteStep) return "확인";

    if (isLockerBranchSelectStep) {
      return "지점 확정";
    }

    if (isLockerBranchConfirmStep) {
      return "입고 대기";
    }

    if (isLockerDepositWaitingStep) {
      return "입고 대기중";
    }

    return steps[currentStepIndex + 1]?.title ?? "다음 단계";
  };

  const renderSelectedBranchSummary = () => {
    if (!selectedLocation) return null;

    return (
      <div className={styles.selectedBranchSummary}>
        {selectedLocation.LOCATION_IMG ? (
          <img
            src={getLocationImageSrc(selectedLocation.LOCATION_IMG)}
            alt={selectedLocation.BRANCH_NAME}
            className={styles.selectedBranchImage}
          />
        ) : (
          <div className={styles.selectedBranchImageEmpty}>이미지 없음</div>
        )}

        <div className={styles.selectedBranchInfoWrap}>
          <div className={styles.selectedBranchTop}>
            <div className={styles.selectedBranchInfoText}>
              <div className={styles.selectedBranchName}>
                {selectedLocation.BRANCH_NAME}
              </div>
              <div className={styles.selectedBranchAddress}>
                {selectedLocation.DETAIL_ADDRESS}
              </div>
            </div>

            <span className={styles.selectedBranchStatus}>
              {getBranchStatusLabel(selectedLocation.STATUS_CODE)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderBranchSelectCard = () => {
    if (!selectedLocation) return null;

    return (
      <div className={styles.selectedBranchCard}>
        {renderSelectedBranchSummary()}

        <div className={styles.selectedBranchLockerSection}>
          <div className={styles.selectedBranchLockerTitle}>보관함 상태</div>

          <div className={styles.selectedBranchLockerGrid}>
            {lockerStates.map((locker) => (
              <div
                key={`${locker.KIOSK_ID}-${locker.LOCKER_ID}`}
                className={styles.selectedBranchLockerItem}
              >
                <div className={styles.selectedBranchLockerIcon}>▣</div>
                <div>
                  <div className={styles.selectedBranchLockerNo}>
                    {locker.LOCKER_ID}번 보관함
                  </div>
                  <div className={styles.selectedBranchLockerStatus}>
                    {getLockerStatusLabel(locker.LOCKER_STATUS)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBranchActionButtons = () => {
    return (
      <div className={styles.lockerActionButtonRow}>
        <button
          type="button"
          className={styles.lockerSubActionButton}
          onClick={() => {
            setChatDrawerOpen(true);
            setMapDrawerOpen(false);
          }}
        >
          채팅하기
        </button>

        <button
          type="button"
          className={styles.lockerSubActionButton}
          onClick={handleOpenMapDrawer}
          disabled={!isSeller}
        >
          {selectedLocation ? "지점 재선택" : "지점 선택"}
        </button>
      </div>
    );
  };

  const isMainButtonDisabled =
    submitting ||
    (isLockerBranchSelectStep && (!isSeller || !selectedLocation?.KIOSK_ID)) ||
    (isLockerBranchConfirmStep && (!isSeller || !selectedLocation?.KIOSK_ID)) ||
    isLockerDepositWaitingStep;

  return (
    <>
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
              disabled={isMainButtonDisabled}
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
            <span className={styles.tradeBadge}>
              {tradeType === "DIRECT"
                ? "직거래"
                : tradeType === "DELIVERY"
                  ? "택배거래"
                  : "보관함거래"}
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
            {visibleSteps.map((step) => {
              const originalIndex = steps.findIndex(
                (item) => item.statusCode === step.statusCode,
              );

              const isDone = originalIndex < currentStepIndex;
              const isCurrent = originalIndex === currentStepIndex;
              const isActive = originalIndex <= currentStepIndex;

              return (
                <li
                  key={`${step.statusCode}-${originalIndex}`}
                  className={[
                    styles.stepItem,
                    isDone ? styles.done : "",
                    isCurrent ? styles.current : "",
                    isActive ? styles.active : "",
                  ].join(" ")}
                >
                  <div className={styles.stepCircle}>
                    {isCurrent ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span>{originalIndex + 1}</span>
                    )}
                  </div>

                  <div className={styles.stepLabel}>{step.title}</div>

                  {isCurrent && (
                    <div className={styles.statusBadge}>진행중</div>
                  )}
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

          {isLockerBranchSelectStep && (
            <div className={styles.lockerActionBox}>
              {isSeller ? (
                <>
                  <div className={styles.lockerActionHeader}>
                    <div>
                      <h4 className={styles.lockerActionTitle}>지점 선택</h4>
                      <p className={styles.lockerActionDesc}>
                        보관함 거래에 사용할 지점을 선택해주세요.
                      </p>
                    </div>
                  </div>

                  {renderBranchSelectCard()}
                  {renderBranchActionButtons()}
                </>
              ) : (
                <div className={styles.lockerNoticeBox}>
                  판매자가 보관함 지점을 선택 중입니다.
                </div>
              )}
            </div>
          )}

          {isLockerBranchConfirmStep && (
            <div className={styles.lockerActionBox}>
              <div className={styles.lockerActionHeader}>
                <div>
                  <h4 className={styles.lockerActionTitle}>지점 확정</h4>
                  <p className={styles.lockerActionDesc}>
                    선택한 지점을 확인한 뒤 판매자가 입고 대기 단계로
                    진행합니다.
                  </p>
                </div>
              </div>

              {renderBranchSelectCard()}
              {renderBranchActionButtons()}
            </div>
          )}

          {isLockerDepositWaitingStep && (
            <div className={styles.lockerActionBox}>
              <div className={styles.lockerActionHeader}>
                <div>
                  <h4 className={styles.lockerActionTitle}>입고 대기</h4>
                  <p className={styles.lockerActionDesc}>
                    판매자가 키오스크에서 본인 인증 후 상품을 입고하면 다음
                    단계로 진행됩니다.
                  </p>
                </div>
              </div>

              {renderSelectedBranchSummary()}

              <div className={styles.lockerStateHeader}>
                <div className={styles.lockerStateTitle}>보관함 상태</div>

                <button
                  type="button"
                  className={styles.refreshButton}
                  onClick={refreshLockerStates}
                  disabled={lockerStateLoading}
                >
                  {lockerStateLoading ? "새로고침 중" : "새로고침"}
                </button>
              </div>

              <div className={styles.lockerGrid}>
                {lockerStates.map((locker) => (
                  <div
                    key={`${locker.KIOSK_ID}-${locker.LOCKER_ID}`}
                    className={styles.lockerItem}
                  >
                    <div className={styles.lockerIcon}>▣</div>
                    <div className={styles.lockerNo}>
                      {locker.LOCKER_ID}번 보관함
                    </div>
                    <div className={styles.lockerStatus}>
                      {getLockerStatusLabel(locker.LOCKER_STATUS)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </DrawerLayout>

      <LockerMapDrawer
        open={mapDrawerOpen}
        accessToken={localStorage.getItem("accessToken") ?? ""}
        initialSelectedLocation={selectedLocation}
        onClose={() => setMapDrawerOpen(false)}
        onLocationSelected={handleMapLocationSelected}
      />

      <ChatDrawer
        open={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
      />
    </>
  );
}
