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
import styles from "./LockerTradeProgressSection.module.css";

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

const lockerSteps: Step[] = [
  {
    title: "지점 선택",
    description: "판매자가 상품을 입고할 보관함 지점을 선택합니다.",
    statusCode: "BRANCH_SELECT",
  },
  {
    title: "지점 확정",
    description:
      "선택한 지점을 확인한 뒤 판매자가 입고 대기 단계로 진행합니다.",
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
    statusCode: "DEPOSITED",
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
  TR_06: "DEPOSITED",
  TR_07: "RETURED",
  TR_08: "PICKEDUP",
  TR_09: "DISPUTED",
  TR_15: "BRANCH_SELECTED",
  TR_16: "DEPOSIT_WAITING",

  CANCELD: "CANCELED",
  CANCELED: "CANCELED",
  RETURNED: "RETURED",
  RETURED: "RETURED",
  SELLER_DEPOSITED: "DEPOSITED",
};

function formatPrice(value: number) {
  return `${Number(value ?? 0).toLocaleString()}원`;
}

function normalizeBaseStatusCode(statusCode?: string | null) {
  if (!statusCode) return "";

  const code = String(statusCode).trim();

  return statusAliasMap[code] ?? code;
}

function normalizeLockerStatusCode(statusCode?: string | null) {
  const normalized = normalizeBaseStatusCode(statusCode);

  if (normalized === "TRADING") {
    return "BRANCH_SELECT";
  }

  return normalized;
}

function getResponseStatusCode(result: unknown) {
  if (!result) return "";

  if (typeof result === "string") {
    return normalizeLockerStatusCode(result);
  }

  const data = Array.isArray(result) ? result[0] : result;

  if (typeof data !== "object" || data === null) {
    return "";
  }

  const obj = data as Record<string, unknown>;

  return normalizeLockerStatusCode(
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

function getVisibleSteps(steps: Step[], currentIndex: number) {
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

function getLocationNumber(
  location: TradeLockerLocationResponse | null,
  keys: string[],
) {
  if (!location) return null;

  const obj = location as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = obj[key];

    if (value === null || value === undefined || value === "") continue;

    const numberValue = Number(value);

    if (!Number.isNaN(numberValue)) {
      return numberValue;
    }
  }

  return null;
}

function loadKakaoMapScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve();
      return;
    }

    const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY;

    if (!appKey) {
      reject(new Error("VITE_KAKAO_MAP_APP_KEY가 없습니다."));
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kakao-map="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.kakao?.maps) {
          window.kakao.maps.load(() => resolve());
        } else {
          reject(new Error("카카오맵 스크립트 로딩 실패"));
        }
      });

      existingScript.addEventListener("error", () => {
        reject(new Error("카카오맵 스크립트 로딩 실패"));
      });

      return;
    }

    const script = document.createElement("script");

    script.dataset.kakaoMap = "true";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;

    script.onload = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => resolve());
      } else {
        reject(new Error("카카오맵 스크립트 로딩 실패"));
      }
    };

    script.onerror = () => {
      reject(new Error("카카오맵 스크립트 로딩 실패"));
    };

    document.head.appendChild(script);
  });
}

type MiniBranchMapProps = {
  location: TradeLockerLocationResponse | null;
};

function MiniBranchMap({ location }: MiniBranchMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  const latitude = getLocationNumber(location, [
    "LATITUDE",
    "latitude",
    "LAT",
    "lat",
    "Y",
    "y",
  ]);

  const longitude = getLocationNumber(location, [
    "LONGITUDE",
    "longitude",
    "LNG",
    "lng",
    "LON",
    "lon",
    "X",
    "x",
  ]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (latitude === null || longitude === null) return;

    let canceled = false;

    const renderMap = async () => {
      try {
        await loadKakaoMapScript();

        if (canceled || !mapRef.current || !window.kakao?.maps) return;

        const center = new window.kakao.maps.LatLng(latitude, longitude);

        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 4,
          draggable: false,
          scrollwheel: false,
          disableDoubleClick: true,
          disableDoubleClickZoom: true,
        });

        new window.kakao.maps.Marker({
          position: center,
          map,
        });

        window.setTimeout(() => {
          map.relayout();
          map.setCenter(center);
        }, 0);
      } catch (error) {
        console.error("미니 지도 로딩 실패:", error);
      }
    };

    renderMap();

    return () => {
      canceled = true;
    };
  }, [latitude, longitude, location?.KIOSK_ID]);

  if (latitude === null || longitude === null) {
    return <div className={styles.branchMiniMapEmpty}>지도 좌표 없음</div>;
  }

  return <div ref={mapRef} className={styles.branchMiniMap} />;
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

export default function LockerTradeProgressSection({
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

  const [resolvedTradeId, setResolvedTradeId] = useState(tradeId);
  const [currentStatusCode, setCurrentStatusCode] = useState(() =>
    normalizeLockerStatusCode(initialStatusCode ?? "BRANCH_SELECT"),
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

  useEffect(() => {
    setResolvedTradeId(tradeId);
  }, [tradeId]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    setCurrentStatusCode(
      normalizeLockerStatusCode(initialStatusCode ?? "BRANCH_SELECT"),
    );
  }, [initialStatusCode]);

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

    if (!accessToken) return;

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
  }, [resolveTradeId]);

  const refreshLockerStates = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    if (!selectedLocation?.KIOSK_ID) {
      message.error("선택된 지점 정보가 없습니다.");
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
      message.error("보관함 상태를 불러오지 못했습니다.");
    } finally {
      setLockerStateLoading(false);
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken || !product.productId) return;

    let stopped = false;

    const syncLockerTradeStatusOnce = async () => {
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

        if (detail.TRADE_ID) {
          setResolvedTradeId(Number(detail.TRADE_ID));
        }

        if (detail.MY_ROLE) {
          setMyRole(detail.MY_ROLE);
        }

        const latestStatusCode = normalizeLockerStatusCode(
          detail.STATUS_CODE ??
            detail.RESULT_STATUS_CODE ??
            detail.NEXT_STATUS_CODE,
        );

        if (!latestStatusCode) return;

        setCurrentStatusCode(latestStatusCode);
        onStatusChangeRef.current?.(latestStatusCode);
      } catch (error) {
        console.error("보관함 거래 최신 상태 조회 실패:", error);
      }
    };

    syncLockerTradeStatusOnce();

    return () => {
      stopped = true;
    };
  }, [product.productId]);

  useEffect(() => {
    if (
      currentStatusCode === "BRANCH_SELECTED" ||
      currentStatusCode === "DEPOSIT_WAITING" ||
      currentStatusCode === "DEPOSITED" ||
      currentStatusCode === "PAID" ||
      currentStatusCode === "PICKEDUP" ||
      currentStatusCode === "COMPLETED"
    ) {
      fetchLockerLocationAndStates();
    }
  }, [currentStatusCode, fetchLockerLocationAndStates]);

  const currentStepIndex = useMemo(() => {
    return getStepIndexByStatusCode(lockerSteps, currentStatusCode);
  }, [currentStatusCode]);

  const visibleSteps = useMemo(() => {
    return getVisibleSteps(lockerSteps, currentStepIndex);
  }, [currentStepIndex]);

  const lastIndex = lockerSteps.length - 1;
  const isCompleteStep = currentStepIndex === lastIndex;
  const currentStep = lockerSteps[currentStepIndex];
  const nextStatusCode = getNextStatusCode(lockerSteps, currentStatusCode);

  const isSeller = myRole === "SELLER";
  const isBuyer = myRole === "BUYER";

  const isLockerBranchSelectStep = currentStatusCode === "BRANCH_SELECT";
  const isLockerBranchConfirmStep = currentStatusCode === "BRANCH_SELECTED";
  const isLockerDepositWaitingStep = currentStatusCode === "DEPOSIT_WAITING";

  const shouldHideDescriptionBox =
    currentStatusCode === "BRANCH_SELECTED" ||
    currentStatusCode === "DEPOSIT_WAITING";

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

      const responseStatusCode = getResponseStatusCode(result);

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

    const targetTradeId = await resolveTradeId();

    if (!targetTradeId) return;

    try {
      setSubmitting(true);

      const result = await tradeApi.updateTradeStatus(accessToken, {
        TRADE_ID: targetTradeId,
        RESULT_STATUS_CODE: "BRANCH_SELECTED",
        NEXT_STATUS_CODE: "DEPOSIT_WAITING",
        TRADE_TYPE_CODE: "LOCKER",
      });

      const responseStatusCode = getResponseStatusCode(result);

      const nextUiStatusCode =
        responseStatusCode &&
        responseStatusCode !== "TRADING" &&
        responseStatusCode !== "BRANCH_SELECT" &&
        responseStatusCode !== "BRANCH_SELECTED"
          ? responseStatusCode
          : "DEPOSIT_WAITING";

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

  const handleMapLocationSelected = async (
    location: TradeLockerLocationResponse,
    states: TradeLockerStateResponse[],
  ) => {
    setSelectedLocation(location);
    setLockerStates(states);

    if (currentStatusCode === "BRANCH_SELECT") {
      setHasSavedLockerLocation(false);
      setMapDrawerOpen(false);
      return;
    }

    if (currentStatusCode === "BRANCH_SELECTED") {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        message.error("로그인이 필요합니다.");
        return;
      }

      const targetTradeId = await resolveTradeId();

      if (!targetTradeId) return;

      await tradeApi.updateTradeLockerLocation(accessToken, {
        TRADE_ID: targetTradeId,
        KIOSK_ID: location.KIOSK_ID,
        USER_ID: 0,
      });

      setHasSavedLockerLocation(true);
      setMapDrawerOpen(false);
      message.success("지점이 재선택되었습니다.");
    }
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

    if (isLockerBranchSelectStep) return "지점 확정";
    if (isLockerBranchConfirmStep) return "입고 대기";
    if (isLockerDepositWaitingStep) return "입고 대기중";

    return lockerSteps[currentStepIndex + 1]?.title ?? "다음 단계";
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
          <div className={styles.selectedBranchImageEmpty}>0</div>
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

        <MiniBranchMap
          key={selectedLocation.KIOSK_ID ?? "empty"}
          location={selectedLocation}
        />

        <div className={styles.selectedBranchLockerSection}>
          <div className={styles.selectedBranchLockerHeader}>
            <div className={styles.selectedBranchLockerTitle}>보관함 상태</div>

            <button
              type="button"
              className={styles.lockerRefreshIconButton}
              onClick={refreshLockerStates}
              disabled={lockerStateLoading}
              aria-label="보관함 상태 새로고침"
            >
              ↻
            </button>
          </div>

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
    const locationButtonText =
      currentStatusCode === "BRANCH_SELECTED" && isSeller
        ? "지점 재선택"
        : "위치 확인";

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
        >
          {locationButtonText}
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
            <span className={styles.tradeBadge}>보관함거래</span>
            <h2>{product.title}</h2>
            <strong>{formatPrice(product.expectedPrice)}</strong>
          </div>
        </section>

        <section className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <h3>거래 진행 상황</h3>
            <p>
              {currentStepIndex + 1} / {lockerSteps.length}
            </p>
          </div>

          <ol className={styles.stepBar}>
            {visibleSteps.map((step) => {
              const originalIndex = lockerSteps.findIndex(
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

          {!shouldHideDescriptionBox && (
            <div className={styles.descriptionBox}>
              <div className={styles.descriptionIcon}>✓</div>
              <div>
                <h4>{currentStep.title}</h4>
                <p>{currentStep.description}</p>
              </div>
            </div>
          )}

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

              {renderBranchSelectCard()}
              {renderBranchActionButtons()}
            </div>
          )}
        </section>
      </DrawerLayout>

      <LockerMapDrawer
        open={mapDrawerOpen}
        accessToken={localStorage.getItem("accessToken") ?? ""}
        initialSelectedLocation={selectedLocation}
        readonly={
          isBuyer ||
          currentStatusCode === "DEPOSIT_WAITING" ||
          currentStatusCode === "DEPOSITED" ||
          currentStatusCode === "PAID" ||
          currentStatusCode === "PICKEDUP" ||
          currentStatusCode === "COMPLETED"
        }
        selectButtonText={
          currentStatusCode === "BRANCH_SELECTED" ? "지점 재선택" : "선택하기"
        }
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
