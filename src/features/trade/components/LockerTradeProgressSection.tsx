import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import { tradeApi, type TradeLockerImageResponse } from "../api/tradeApi";
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
import { getOrCreateChatRoomForProduct } from "../../chat/api/chatApi";
import { useChatDrawer } from "../../chat/context/ChatDrawerContext";

declare global {
  interface Window {
    kakao?: any;
  }
}

type Step = {
  title: string;
  description: string;
  buyerDescription: string;
  sellerDescription: string;
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

const LOCKER_STATUS_POLLING_INTERVAL_MS = 2000;
const LOCKER_IMAGE_POLLING_INTERVAL_MS = 3000;

const lockerSteps: Step[] = [
  {
    title: "지점 선택",
    description: "판매자가 상품을 보관할 보관함 지점을 선택합니다.",
    buyerDescription:
      "판매자가 상품을 보관할 보관함 지점을 선택하는 중입니다. 지점이 선택되면 화면에 지점 정보가 표시됩니다.",
    sellerDescription: "상품을 보관할 보관함 지점을 선택해주세요.",
    statusCode: "BRANCH_SELECT",
  },
  {
    title: "지점 확정",
    description: "판매자와 협의하여 지점을 확정할 차례입니다.",
    buyerDescription:
      "판매자가 보관함 지점을 확정했습니다. 이후 판매자의 키오스크 보관 절차를 기다려주세요.",
    sellerDescription:
      "선택한 지점을 확정했습니다. 보관 대기 버튼을 눌러 키오스크 보관 단계로 진행해주세요.",
    statusCode: "BRANCH_SELECTED",
  },
  {
    title: "보관 대기",
    description: "판매자가 키오스크에서 상품을 보관할 차례입니다.",
    buyerDescription:
      "판매자가 키오스크에서 물품을 보관하는 중입니다. 보관이 완료되면 보관함 내부 사진이 화면에 표시됩니다.",
    sellerDescription:
      "키오스크에서 본인 인증 후 물품을 보관해주세요. 이후 보관이 완료되면 보관함 내부 사진이 화면에 표시됩니다.",
    statusCode: "DEPOSIT_WAITING",
  },
  {
    title: "보관 완료",
    description: "판매자가 상품을 보관함에 보관했습니다.",
    buyerDescription:
      "판매자가 물품 보관을 완료했습니다. 지점에 방문하여 물품 확인 후 물품을 수령해주세요.",
    sellerDescription:
      "물품 보관이 완료되었습니다. 구매자가 물품을 결제 후 수령할 때까지 기다려주세요.",
    statusCode: "DEPOSITED",
  },
  {
    title: "결제 완료",
    description: "구매자가 상품 확인 후 결제를 완료했습니다.",
    buyerDescription:
      "결제가 완료되었습니다. 키오스크에서 보관함을 열고 물품을 수령해주세요.",
    sellerDescription:
      "구매자의 결제가 완료되었습니다. 구매자가 키오스크에서 물품을 수령하는 중입니다.",
    statusCode: "PAID",
  },
  {
    title: "수령 완료",
    description: "구매자가 보관함에서 상품을 수령했습니다.",
    buyerDescription:
      "물품 수령이 완료되었습니다. 문제가 없다면 거래 완료 버튼을 누르거나 24시간이 지나면 자동으로 거래가 최종 완료됩니다.",
    sellerDescription:
      "구매자가 물품을 수령했습니다. 최종 거래 완료는 구매자 승인 혹은 24시간이 지나면 자동으로 처리됩니다.",
    statusCode: "PICKEDUP",
  },
  {
    title: "거래 완료",
    description: "보관함 거래가 완료되었습니다.",
    buyerDescription:
      "거래가 최종 완료되었습니다. Loocker를 이용해주셔서 감사합니다.",
    sellerDescription:
      "거래가 최종 완료되었습니다. Loocker를 이용해주셔서 감사합니다.",
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

const CHAT_DRAWER_WIDTH = 640;
const FALLBACK_TRADE_DRAWER_WIDTH = 520;
const DRAWER_GAP = 6;

const KIOSK_AUTO_STATUS_CODES = new Set([
  "DEPOSIT_WAITING",
  "DEPOSITED",
  "PAID",
]);

function getCurrentRightDrawerWidth() {
  const wrappers = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".ant-drawer-right .ant-drawer-content-wrapper",
    ),
  );

  const visibleWrappers = wrappers
    .map((el) => ({
      el,
      rect: el.getBoundingClientRect(),
    }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0 && rect.right > 0);

  if (visibleWrappers.length === 0) {
    return FALLBACK_TRADE_DRAWER_WIDTH;
  }

  const rightMostDrawer = visibleWrappers.reduce((best, current) =>
    current.rect.right > best.rect.right ? current : best,
  );

  return Math.ceil(rightMostDrawer.rect.width);
}

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
        obj.TRADE_STATUS_CODE ??
        obj.NEXT_STATUS_CODE ??
        obj.resultStatusCode ??
        obj.statusCode ??
        obj.tradeStatusCode ??
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

function getVisibleSteps(steps: Step[], currentIndex: number) {
  if (currentIndex <= 2) {
    return steps.slice(0, 5);
  }

  return steps.slice(currentIndex - 2, currentIndex + 3);
}

function getStepDescriptionByRole(step: Step, role: TradeRole | null) {
  if (role === "SELLER") return step.sellerDescription;
  if (role === "BUYER") return step.buyerDescription;

  return step.description;
}

function isKioskAutoStatus(statusCode: string) {
  return KIOSK_AUTO_STATUS_CODES.has(statusCode);
}

type LockerStatusVariant = "available" | "inUse" | "broken" | "unknown";

function getLockerStatusVariant(status?: string): LockerStatusVariant {
  switch (status) {
    case "AVAILABLE":
    case "EMPTY":
      return "available";

    case "IN_USE":
      return "inUse";

    case "BROKEN":
      return "broken";

    default:
      return "unknown";
  }
}

function getLockerStatusLabel(status?: string) {
  switch (getLockerStatusVariant(status)) {
    case "available":
      return "비어있음";
    case "inUse":
      return "사용 중";
    case "broken":
      return "고장";
    default:
      return status || "상태 미확인";
  }
}

function getLockerIconVariantClassName(status?: string) {
  switch (getLockerStatusVariant(status)) {
    case "available":
      return styles.lockerIconAvailable;
    case "inUse":
      return styles.lockerIconInUse;
    case "broken":
      return styles.lockerIconBroken;
    default:
      return styles.lockerIconUnknown;
  }
}

function getLockerStatusTextClassName(status?: string) {
  switch (getLockerStatusVariant(status)) {
    case "available":
      return styles.lockerStatusTextAvailable;
    case "inUse":
      return styles.lockerStatusTextInUse;
    case "broken":
      return styles.lockerStatusTextBroken;
    default:
      return styles.lockerStatusTextUnknown;
  }
}

function getLockerDisplayNo(locker: TradeLockerStateResponse) {
  const obj = locker as unknown as Record<string, unknown>;

  const rawValue = Number(obj.LOCKER_NO ?? obj.LOCKER_ID ?? 0);

  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return "-";
  }

  return ((rawValue - 1) % 4) + 1;
}

function LockerStatusIcon({
  status,
  className,
}: {
  status?: string;
  className: string;
}) {
  const variant = getLockerStatusVariant(status);

  return (
    <span
      className={`${className} ${getLockerIconVariantClassName(status)}`}
      role="img"
      aria-label={getLockerStatusLabel(status)}
    >
      {variant === "available" && (
        <svg
          className={styles.filledStatusIcon}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <g fill="currentColor" stroke="none">
            <path d="M3.7 7.7 8.9 4.9 11.65 7.25 6.45 10.15 3.7 7.7Z" />
            <path d="M20.3 7.7 15.1 4.9 12.35 7.25 17.55 10.15 20.3 7.7Z" />
            <path d="M6.15 11.05 11.25 13.75V19.15L6.15 16.45V11.05Z" />
            <path d="M17.85 11.05 12.75 13.75V19.15L17.85 16.45V11.05Z" />
            <path
              d="M7.25 10.65 12 8.05 16.75 10.65 12 13.2 7.25 10.65Z"
              opacity="0.72"
            />
          </g>
        </svg>
      )}

      {variant === "inUse" && (
        <svg
          className={styles.strokeStatusIcon}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M7 10.25h10A2.25 2.25 0 0 1 19.25 12.5V18A2.25 2.25 0 0 1 17 20.25H7A2.25 2.25 0 0 1 4.75 18v-5.5A2.25 2.25 0 0 1 7 10.25Z" />
          <path d="M8.5 10.25V8a3.5 3.5 0 0 1 7 0v2.25" />
          <path d="M12 14.25v2" />
        </svg>
      )}

      {variant === "broken" && (
        <svg
          className={styles.strokeStatusIcon}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 3.75 21 19.25H3L12 3.75Z" />
          <path d="M12 9v4.5" />
          <path d="M12 16.75h.01" />
        </svg>
      )}

      {variant === "unknown" && (
        <svg
          className={styles.strokeStatusIcon}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 21.25a9.25 9.25 0 1 0 0-18.5 9.25 9.25 0 0 0 0 18.5Z" />
          <path d="M9.75 9.25a2.35 2.35 0 1 1 3.53 2.03c-.8.48-1.28.92-1.28 1.97" />
          <path d="M12 16.75h.01" />
        </svg>
      )}
    </span>
  );
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

function getLockerImageData(result: unknown): TradeLockerImageResponse | null {
  if (!result) return null;

  if (Array.isArray(result)) {
    const merged: TradeLockerImageResponse = {};

    result.forEach((item) => {
      if (typeof item !== "object" || item === null) return;

      const obj = item as TradeLockerImageResponse;

      if (obj.TRADE_ID) merged.TRADE_ID = obj.TRADE_ID;
      if (obj.LOCKER_ID) merged.LOCKER_ID = obj.LOCKER_ID;

      if (obj.SELLER_IMAGE_URL || obj.sellerImageUrl) {
        merged.SELLER_IMAGE_URL = obj.SELLER_IMAGE_URL ?? obj.sellerImageUrl;
      }

      if (obj.BUYER_IMAGE_URL || obj.buyerImageUrl) {
        merged.BUYER_IMAGE_URL = obj.BUYER_IMAGE_URL ?? obj.buyerImageUrl;
      }

      const imageTypeCode = String(
        obj.IMAGE_TYPE_CODE ?? obj.imageTypeCode ?? "",
      ).toUpperCase();

      const imageUrl = obj.IMAGE_URL ?? obj.imageUrl ?? "";

      if (imageTypeCode.includes("SELLER") && imageUrl) {
        merged.SELLER_IMAGE_URL = imageUrl;
      }

      if (imageTypeCode.includes("BUYER") && imageUrl) {
        merged.BUYER_IMAGE_URL = imageUrl;
      }
    });

    return merged;
  }

  if (typeof result !== "object" || result === null) return null;

  return result as TradeLockerImageResponse;
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

export default function LockerTradeProgressSection({
  tradeId,
  product,
  onBack,
  onClose,
  initialStatusCode,
  onStatusChange,
}: Props) {
  const nav = useNavigate();
  const { openChatRoom, closeChat } = useChatDrawer();

  const handleBackTradeProgress = useCallback(() => {
    closeChat();
    onBack();
  }, [closeChat, onBack]);

  const handleCloseTradeProgress = useCallback(() => {
    closeChat();
    onClose();
  }, [closeChat, onClose]);

  useEffect(() => {
    return () => {
      closeChat();
    };
  }, [closeChat]);

  const onStatusChangeRef = useRef(onStatusChange);

  const [resolvedTradeId, setResolvedTradeId] = useState(tradeId);
  const [currentStatusCode, setCurrentStatusCode] = useState(() =>
    normalizeLockerStatusCode(initialStatusCode ?? "BRANCH_SELECT"),
  );
  const [myRole, setMyRole] = useState<TradeRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [mapDrawerOpen, setMapDrawerOpen] = useState(false);

  const [selectedLocation, setSelectedLocation] =
    useState<TradeLockerLocationResponse | null>(null);
  const [lockerStates, setLockerStates] = useState<TradeLockerStateResponse[]>(
    [],
  );
  const [lockerStateLoading, setLockerStateLoading] = useState(false);
  const [hasSavedLockerLocation, setHasSavedLockerLocation] = useState(false);
  const [lockerImages, setLockerImages] =
    useState<TradeLockerImageResponse | null>(null);

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

    const syncLockerTradeStatus = async () => {
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
            detail.TRADE_STATUS_CODE ??
            detail.NEXT_STATUS_CODE,
        );

        if (!latestStatusCode) return;

        setCurrentStatusCode(latestStatusCode);
        onStatusChangeRef.current?.(latestStatusCode);
      } catch (error) {
        console.error("보관함 거래 최신 상태 조회 실패:", error);
      }
    };

    syncLockerTradeStatus();

    const timerId = window.setInterval(() => {
      syncLockerTradeStatus();
    }, LOCKER_STATUS_POLLING_INTERVAL_MS);

    return () => {
      stopped = true;
      window.clearInterval(timerId);
    };
  }, [product.productId]);

  useEffect(() => {
    const shouldFetchImages =
      currentStatusCode === "DEPOSITED" ||
      currentStatusCode === "PAID" ||
      currentStatusCode === "PICKEDUP" ||
      currentStatusCode === "COMPLETED";

    if (!shouldFetchImages) {
      setLockerImages(null);
      return;
    }

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) return;

    let stopped = false;

    const fetchLockerImages = async () => {
      const targetTradeId = resolvedTradeId || (await resolveTradeId());

      if (!targetTradeId) return;

      try {
        const result = await tradeApi.getTradeLockerImages(accessToken, {
          TRADE_ID: targetTradeId,
          USER_ID: 0,
        });

        if (stopped) return;

        setLockerImages(getLockerImageData(result));
      } catch (error) {
        console.error("보관함 이미지 조회 실패:", error);
      }
    };

    fetchLockerImages();

    const timerId = window.setInterval(() => {
      fetchLockerImages();
    }, LOCKER_IMAGE_POLLING_INTERVAL_MS);

    return () => {
      stopped = true;
      window.clearInterval(timerId);
    };
  }, [currentStatusCode, resolvedTradeId, resolveTradeId]);

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

  const isSeller = myRole === "SELLER";
  const isBuyer = myRole === "BUYER";

  const isLockerBranchSelectStep = currentStatusCode === "BRANCH_SELECT";
  const isLockerBranchConfirmStep = currentStatusCode === "BRANCH_SELECTED";
  const isLockerDepositWaitingStep = currentStatusCode === "DEPOSIT_WAITING";
  const isLockerDepositedStep = currentStatusCode === "DEPOSITED";
  const isLockerPaidStep = currentStatusCode === "PAID";
  const isLockerPickedupStep = currentStatusCode === "PICKEDUP";

  const canCompleteTrade = isBuyer && isLockerPickedupStep;
  const isKioskAutoStep = isKioskAutoStatus(currentStatusCode);

  const shouldHideDescriptionBox =
    isLockerBranchSelectStep ||
    isLockerBranchConfirmStep ||
    isLockerDepositWaitingStep ||
    isLockerDepositedStep ||
    isLockerPaidStep ||
    isLockerPickedupStep;

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
        TRADE_TYPE_CODE: "LOCKER",
      });

      message.success("거래가 취소되었습니다.");
      handleCloseTradeProgress();
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

    if (!canCompleteTrade) {
      message.info("현재 단계는 웹에서 직접 변경할 수 없습니다.");
      return;
    }

    const targetTradeId = await resolveTradeId();

    if (!targetTradeId) return;

    try {
      setSubmitting(true);

      const result = await tradeApi.updateTradeStatus(accessToken, {
        TRADE_ID: targetTradeId,
        RESULT_STATUS_CODE: currentStatusCode,
        NEXT_STATUS_CODE: "COMPLETED",
        TRADE_TYPE_CODE: "LOCKER",
      });

      const responseStatusCode = getResponseStatusCode(result) || "COMPLETED";

      setCurrentStatusCode(responseStatusCode);
      onStatusChangeRef.current?.(responseStatusCode);

      message.success("거래가 완료되었습니다.");
    } catch (error) {
      console.error(error);
      message.error("거래 완료 처리에 실패했습니다.");
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

    if (!isSeller) {
      message.error("판매자만 지점을 확정할 수 있습니다.");
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

  const handleCreateDepositWaiting = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      return;
    }

    if (!isSeller) {
      message.error("판매자만 보관 대기 단계로 변경할 수 있습니다.");
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
        responseStatusCode && responseStatusCode !== "BRANCH_SELECTED"
          ? responseStatusCode
          : "DEPOSIT_WAITING";

      setCurrentStatusCode(nextUiStatusCode);
      onStatusChangeRef.current?.(nextUiStatusCode);

      message.success("보관 대기 상태로 변경되었습니다.");
    } catch (error) {
      console.error(error);
      message.error("보관 대기 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChatRoom = async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      message.error("로그인이 필요합니다.");
      nav("/signin");
      return;
    }

    if (!product.productId) {
      message.error("상품 정보를 확인할 수 없습니다.");
      return;
    }

    try {
      const room = await getOrCreateChatRoomForProduct(product.productId);

      const tradeDrawerWidth = getCurrentRightDrawerWidth();

      const shouldOpenBesideTradeDrawer =
        window.innerWidth >= tradeDrawerWidth + CHAT_DRAWER_WIDTH;

      openChatRoom(
        {
          ...room,
          TITLE: room.TITLE ?? product.title,
          IMAGE_URL: room.IMAGE_URL ?? product.imageUrl ?? null,
        },
        shouldOpenBesideTradeDrawer
          ? {
              rightOffset: tradeDrawerWidth + DRAWER_GAP,
              mask: false,
            }
          : undefined,
      );

      setMapDrawerOpen(false);
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : "채팅방을 열 수 없습니다.",
      );
    }
  };

  const handleOpenMapDrawer = async () => {
    const targetTradeId = await resolveTradeId();

    if (!targetTradeId) return;

    setMapDrawerOpen(true);
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
      handleCloseTradeProgress();
      nav(`/product/${product.productId}`);
      return;
    }

    if (isLockerBranchSelectStep) {
      handleCreateBranchSelected();
      return;
    }

    if (isLockerBranchConfirmStep) {
      handleCreateDepositWaiting();
      return;
    }

    if (canCompleteTrade) {
      handleProgress();
      return;
    }

    if (isKioskAutoStep || isLockerDepositWaitingStep) {
      message.info("이 단계는 키오스크와 백엔드에서 자동으로 처리됩니다.");
      return;
    }

    if (isLockerPickedupStep && !isBuyer) {
      message.info("거래 완료는 구매자 화면에서만 처리할 수 있습니다.");
      return;
    }

    message.info("현재 화면에서 직접 변경할 수 없는 단계입니다.");
  };

  const getButtonText = () => {
    if (isCompleteStep) return "확인";

    if (isLockerBranchSelectStep) return "지점 확정";

    if (isLockerBranchConfirmStep) return "보관 대기";

    if (isLockerDepositWaitingStep) return "보관 대기중";

    if (isLockerDepositedStep) return "보관 완료";

    if (isLockerPaidStep) return "결제 완료";

    if (canCompleteTrade) return "거래 완료";

    if (isLockerPickedupStep) return "거래 완료";

    return lockerSteps[currentStepIndex]?.title ?? "자동 처리 단계";
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
                <LockerStatusIcon
                  status={locker.LOCKER_STATUS}
                  className={styles.selectedBranchLockerIcon}
                />

                <div>
                  <div className={styles.selectedBranchLockerNo}>
                    {getLockerDisplayNo(locker)}번 보관함
                  </div>
                  <div
                    className={`${styles.selectedBranchLockerStatus} ${getLockerStatusTextClassName(
                      locker.LOCKER_STATUS,
                    )}`}
                  >
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
          onClick={() => void handleOpenChatRoom()}
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

  const renderLockerImageCard = () => {
    const sellerImageUrl =
      lockerImages?.SELLER_IMAGE_URL ?? lockerImages?.sellerImageUrl ?? "";

    const buyerImageUrl =
      lockerImages?.BUYER_IMAGE_URL ?? lockerImages?.buyerImageUrl ?? "";

    return (
      <div className={styles.lockerImageCard}>
        <div className={styles.lockerImageHeader}>
          <h4 className={styles.lockerImageTitle}>보관함 촬영 사진</h4>
          <p className={styles.lockerImageDesc}>
            키오스크에서 촬영된 판매자 보관 사진과 구매자 수령 사진입니다.
          </p>
        </div>

        <div className={styles.lockerImageGrid}>
          <div className={styles.lockerImageBlock}>
            <div className={styles.lockerImageLabel}>판매자 보관 사진</div>

            {sellerImageUrl ? (
              <img
                src={toApiAssetUrl(sellerImageUrl)}
                alt="판매자 보관 사진"
                className={styles.lockerTradeImage}
              />
            ) : (
              <div className={styles.lockerImageEmpty}>
                판매자 보관 사진을 불러오는 중입니다.
              </div>
            )}
          </div>

          <div className={styles.lockerImageBlock}>
            <div className={styles.lockerImageLabel}>구매자 수령 사진</div>

            {buyerImageUrl ? (
              <img
                src={toApiAssetUrl(buyerImageUrl)}
                alt="구매자 수령 사진"
                className={styles.lockerTradeImage}
              />
            ) : (
              <div className={styles.lockerImageEmpty}>
                구매자 수령 사진이 아직 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAutoStepActionBox = (
    title: string,
    sellerDescription: string,
    buyerDescription: string,
    showImages = false,
  ) => {
    return (
      <div className={styles.lockerActionBox}>
        <div className={styles.lockerActionHeader}>
          <div>
            <h4 className={styles.lockerActionTitle}>{title}</h4>
            <p className={styles.lockerActionDesc}>
              {isSeller ? sellerDescription : buyerDescription}
            </p>
          </div>
        </div>

        {renderBranchSelectCard()}
        {renderBranchActionButtons()}
        {showImages && renderLockerImageCard()}
      </div>
    );
  };

  const isMainButtonDisabled =
    submitting ||
    (isLockerBranchSelectStep && (!isSeller || !selectedLocation?.KIOSK_ID)) ||
    (isLockerBranchConfirmStep && !isSeller) ||
    isKioskAutoStep ||
    (isLockerPickedupStep && !canCompleteTrade);

  return (
    <>
      <DrawerLayout
        title="거래 진행"
        onBack={handleBackTradeProgress}
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
                <p>{getStepDescriptionByRole(currentStep, myRole)}</p>
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

          {isLockerBranchConfirmStep &&
            renderAutoStepActionBox(
              "지점 확정",
              "선택한 지점이 확정되었습니다. 보관 대기 버튼을 눌러 키오스크 보관 단계로 진행해주세요.",
              "판매자가 보관함 지점을 확정했습니다. 판매자가 보관 대기 단계로 넘긴 뒤 키오스크에서 물품 보관을 진행합니다.",
            )}

          {isLockerDepositWaitingStep &&
            renderAutoStepActionBox(
              "보관 대기",
              "키오스크에서 본인 인증 후 물품을 보관해주세요. 보관이 완료되면 자동으로 다음 단계로 변경됩니다.",
              "판매자가 키오스크에서 물품을 보관 중입니다. 보관 완료 후 물품 확인을 진행할 수 있습니다.",
            )}

          {isLockerDepositedStep &&
            renderAutoStepActionBox(
              "보관 완료",
              "물품 보관이 완료되었습니다. 이후 결제와 수령 절차는 구매자가 키오스크에서 진행합니다.",
              "판매자가 물품 보관을 완료했습니다. 이후 결제가 완료되면 키오스크에서 물품을 수령할 수 있습니다.",
              true,
            )}

          {isLockerPaidStep &&
            renderAutoStepActionBox(
              "결제 완료",
              "구매자의 결제가 완료되었습니다. 구매자가 키오스크에서 물품을 수령하면 상태가 자동 변경됩니다.",
              "결제가 완료되었습니다. 키오스크에서 보관함을 열고 물품을 수령해주세요.",
              true,
            )}

          {isLockerPickedupStep &&
            renderAutoStepActionBox(
              "수령 완료",
              "구매자가 물품을 수령했습니다. 거래 완료 처리는 구매자 화면에서만 가능합니다.",
              "물품 수령이 완료되었습니다. 문제가 없다면 아래 거래 완료 버튼을 눌러주세요.",
              true,
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
    </>
  );
}
