import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import { tradeApi } from "../api/tradeApi";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";
import type {
  TradeLockerLocationResponse,
  TradeLockerStateResponse,
} from "../types/trade.types";
import styles from "./LockerTradeProgressSection.module.css";

type LockerMapDrawerProps = {
  open: boolean;
  accessToken: string;
  initialSelectedLocation: TradeLockerLocationResponse | null;
  readonly?: boolean;
  selectButtonText?: string;
  onClose: () => void;
  onLocationSelected?: (
    location: TradeLockerLocationResponse,
    lockerStates: TradeLockerStateResponse[],
  ) => void | Promise<void>;
};

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY;

/**
 * 성결대학교 기준 좌표
 * 선택된 지점이 없을 때 지도 첫 중심으로 사용
 */
const SUNGKYUL_UNIVERSITY_LATITUDE = 37.380028;
const SUNGKYUL_UNIVERSITY_LONGITUDE = 126.928639;

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

/**
 * DB LOCKER_ID가 1,2,3,4,5,6,7,8... 로 와도
 * 화면에서는 1,2,3,4,1,2,3,4... 로 표시
 */
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

function loadKakaoMapSDK() {
  return new Promise<void>((resolve, reject) => {
    if (!KAKAO_APP_KEY) {
      reject(new Error("VITE_KAKAO_MAP_APP_KEY가 설정되지 않았습니다."));
      return;
    }

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }

    const existed = document.querySelector<HTMLScriptElement>(
      `script[data-kakao-map-sdk="true"]`,
    );

    if (existed) {
      existed.addEventListener("load", () => {
        if (window.kakao?.maps) {
          window.kakao.maps.load(() => resolve());
        } else {
          reject(new Error("Kakao Map SDK 로드 실패"));
        }
      });

      existed.addEventListener("error", () => {
        reject(new Error("Kakao Map SDK 스크립트 로드 실패"));
      });

      return;
    }

    const script = document.createElement("script");
    script.dataset.kakaoMapSdk = "true";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`;
    script.async = true;

    script.onload = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => resolve());
      } else {
        reject(new Error("Kakao Map SDK 로드 실패"));
      }
    };

    script.onerror = () => {
      reject(new Error("Kakao Map SDK 스크립트 로드 실패"));
    };

    document.head.appendChild(script);
  });
}

export default function LockerMapDrawer({
  open,
  accessToken,
  initialSelectedLocation,
  readonly = false,
  selectButtonText = "선택하기",
  onClose,
  onLocationSelected,
}: LockerMapDrawerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const branchPanelRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);

  const [locations, setLocations] = useState<TradeLockerLocationResponse[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<TradeLockerLocationResponse | null>(null);
  const [lockerStates, setLockerStates] = useState<TradeLockerStateResponse[]>(
    [],
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [mapReadyTick, setMapReadyTick] = useState(0);

  const filteredLocations = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return locations;

    return locations.filter((location) => {
      const branchName = String(location.BRANCH_NAME ?? "").toLowerCase();
      const address = String(location.DETAIL_ADDRESS ?? "").toLowerCase();

      return branchName.includes(keyword) || address.includes(keyword);
    });
  }, [locations, searchKeyword]);

  const fetchLockerStates = useCallback(
    async (kioskId: number) => {
      const states = await tradeApi.getTradeLockerStateList(accessToken, {
        KIOSK_ID: kioskId,
      });

      const nextStates = Array.isArray(states) ? states : [];

      if (!readonly) {
        setLockerStates(nextStates);
      }

      return nextStates;
    },
    [accessToken, readonly],
  );

  const isSameSelectedLocation = useCallback(
    (location: TradeLockerLocationResponse) => {
      return selectedLocation?.KIOSK_ID === location.KIOSK_ID;
    },
    [selectedLocation],
  );

  const handleOverlaySelect = useCallback(
    async (location: TradeLockerLocationResponse) => {
      if (readonly) return;

      try {
        if (selectedLocation?.KIOSK_ID === location.KIOSK_ID) {
          setSelectedLocation(null);
          setLockerStates([]);
          overlaysRef.current.forEach((overlay) => overlay.setMap(null));
          return;
        }

        setSelectedLocation(location);
        await fetchLockerStates(location.KIOSK_ID);

        window.setTimeout(() => {
          branchPanelRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      } catch (error) {
        console.error(error);
        message.error("보관함 상태를 불러오지 못했습니다.");
      }
    },
    [fetchLockerStates, readonly, selectedLocation],
  );

  useEffect(() => {
    if (!open) return;

    setSelectedLocation(initialSelectedLocation);
    setLockerStates([]);
    setSearchKeyword("");

    if (!readonly && initialSelectedLocation?.KIOSK_ID) {
      fetchLockerStates(initialSelectedLocation.KIOSK_ID).catch((error) => {
        console.error(error);
        message.error("보관함 상태를 불러오지 못했습니다.");
      });
    }
  }, [open, readonly, initialSelectedLocation, fetchLockerStates]);

  const fetchLocations = useCallback(
    async (showSuccessMessage = false) => {
      if (!open) return;

      try {
        setLoading(true);

        const data = await tradeApi.getTradeLockerLocationList(accessToken);
        const nextLocations = Array.isArray(data) ? data : [];

        setLocations(nextLocations);

        setSelectedLocation((prev) => {
          if (!prev?.KIOSK_ID) return prev;

          return (
            nextLocations.find(
              (location) => location.KIOSK_ID === prev.KIOSK_ID,
            ) ?? prev
          );
        });

        window.setTimeout(() => {
          if (!mapRef.current) return;

          mapRef.current.relayout();
        }, 100);

        if (showSuccessMessage) {
          message.success("보관함 지점 목록을 새로고침했습니다.");
        }
      } catch (error) {
        console.error(error);
        message.error("보관함 지점 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, open],
  );

  useEffect(() => {
    if (!open) return;

    void fetchLocations(false);
  }, [open, fetchLocations]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const initMap = async () => {
      try {
        await loadKakaoMapSDK();

        if (!mounted || !mapContainerRef.current || !window.kakao?.maps) {
          return;
        }

        const initialLat = Number(initialSelectedLocation?.LATITUDE);
        const initialLng = Number(initialSelectedLocation?.LONGITUDE);

        const hasInitialLocation =
          Number.isFinite(initialLat) && Number.isFinite(initialLng);

        const center = hasInitialLocation
          ? new window.kakao.maps.LatLng(initialLat, initialLng)
          : new window.kakao.maps.LatLng(
              SUNGKYUL_UNIVERSITY_LATITUDE,
              SUNGKYUL_UNIVERSITY_LONGITUDE,
            );

        const map = new window.kakao.maps.Map(mapContainerRef.current, {
          center,
          level: 3,
        });

        mapRef.current = map;
        setMapReadyTick((prev) => prev + 1);

        const mapTypeControl = new window.kakao.maps.MapTypeControl();

        map.addControl(
          mapTypeControl,
          window.kakao.maps.ControlPosition.TOPRIGHT,
        );

        window.setTimeout(() => {
          if (!mounted || !mapRef.current) return;

          mapRef.current.relayout();
          mapRef.current.setCenter(center);
        }, 150);
      } catch (error) {
        console.error("카카오맵 초기화 실패:", error);
        message.error("카카오맵을 불러오지 못했습니다.");
      }
    };

    initMap();

    return () => {
      mounted = false;
    };
  }, [
    open,
    initialSelectedLocation?.LATITUDE,
    initialSelectedLocation?.LONGITUDE,
  ]);

  useEffect(() => {
    if (!open || !window.kakao?.maps || !mapRef.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    filteredLocations.forEach((location) => {
      if (!location.LATITUDE || !location.LONGITUDE) return;

      const lat = Number(location.LATITUDE);
      const lng = Number(location.LONGITUDE);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const pos = new window.kakao.maps.LatLng(lat, lng);

      const marker = new window.kakao.maps.Marker({
        position: pos,
        map: mapRef.current,
      });

      const imageSrc = getLocationImageSrc(location.LOCATION_IMG);
      const selected = isSameSelectedLocation(location);

      const overlayContent = document.createElement("div");
      overlayContent.className = styles.branchOverlay;

      overlayContent.innerHTML = `
        <div class="${styles.branchOverlayCard}">
          <div class="${styles.branchOverlayInner}">
            ${
              imageSrc
                ? `<img src="${imageSrc}" alt="${location.BRANCH_NAME ?? "보관함 지점"}" class="${styles.branchOverlayImage}" />`
                : `<div class="${styles.branchOverlayImageEmpty}">이미지 없음</div>`
            }

            <div class="${styles.branchOverlayBody}">
              <div class="${styles.branchOverlayTitle}">
                ${location.BRANCH_NAME ?? ""}
              </div>

              <div class="${styles.branchOverlayAddress}">
                ${location.DETAIL_ADDRESS ?? ""}
              </div>

              <div class="${styles.branchOverlayBottomRow}">
                <div class="${styles.branchOverlayStatus}">
                  ${getBranchStatusLabel(location.STATUS_CODE)}
                </div>

                ${
                  readonly
                    ? ""
                    : `<button type="button" class="${styles.branchOverlaySelectButton}">
                        ${selected ? "해제" : "선택"}
                      </button>`
                }
              </div>
            </div>
          </div>

          <div class="${styles.branchOverlayArrow}"></div>
        </div>
      `;

      if (!readonly) {
        const selectButton = overlayContent.querySelector("button");

        selectButton?.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          handleOverlaySelect(location);
        });
      }

      const overlay = new window.kakao.maps.CustomOverlay({
        content: overlayContent,
        position: pos,
        yAnchor: 1.25,
        zIndex: 10,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        overlaysRef.current.forEach((item) => item.setMap(null));

        overlay.setMap(mapRef.current);
        mapRef.current.panTo(pos);
      });

      markersRef.current.push(marker);
      overlaysRef.current.push(overlay);

      if (initialSelectedLocation?.KIOSK_ID === location.KIOSK_ID) {
        overlay.setMap(mapRef.current);
        mapRef.current.panTo(pos);
      }
    });
  }, [
    open,
    readonly,
    filteredLocations,
    handleOverlaySelect,
    isSameSelectedLocation,
    selectedLocation,
    initialSelectedLocation,
    mapReadyTick,
  ]);

  const handleSelectLocationOnly = async () => {
    if (!selectedLocation || !onLocationSelected) return;

    try {
      setSelecting(true);

      const states =
        lockerStates.length > 0
          ? lockerStates
          : await fetchLockerStates(selectedLocation.KIOSK_ID);

      await onLocationSelected(selectedLocation, states);
      message.success("지점이 선택되었습니다.");
    } catch (error) {
      console.error(error);
      message.error("지점 선택 처리에 실패했습니다.");
    } finally {
      setSelecting(false);
    }
  };

  if (!open) return null;

  return (
    <aside className={styles.leftDrawer}>
      <div className={styles.mapDrawerHeader}>
        <div className={styles.mapHeaderTextArea}>
          <h2 className={styles.mapDrawerTitle}>
            {readonly ? "보관함 위치 확인" : "보관함 지점 선택"}
          </h2>

          <input
            type="text"
            className={styles.branchSearchInput}
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="지점명 또는 주소로 검색"
          />
        </div>

        <div className={styles.mapHeaderButtonGroup}>
          <button
            type="button"
            className={styles.mapRefreshButton}
            onClick={() => void fetchLocations(true)}
            disabled={loading}
            aria-label="보관함 지점 목록 새로고침"
            title="보관함 지점 목록 새로고침"
          >
            ↻
          </button>

          <button
            type="button"
            className={styles.mapCloseButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>

      <div className={styles.mapDrawerBody}>
        <div ref={mapContainerRef} className={styles.kakaoMap} />

        {loading && !readonly && (
          <div className={styles.branchInfoPanel}>
            <div className={styles.branchEmptyText}>
              보관함 지점 정보를 불러오는 중입니다.
            </div>
          </div>
        )}

        {!readonly && !loading && selectedLocation && (
          <div ref={branchPanelRef} className={styles.branchInfoPanel}>
            {selectedLocation.LOCATION_IMG ? (
              <img
                src={getLocationImageSrc(selectedLocation.LOCATION_IMG)}
                alt={selectedLocation.BRANCH_NAME}
                className={styles.branchImage}
              />
            ) : (
              <div className={styles.branchImageEmpty}>이미지 없음</div>
            )}

            <div className={styles.branchTopRow}>
              <div>
                <div className={styles.branchName}>
                  {selectedLocation.BRANCH_NAME}
                </div>
                <div className={styles.branchAddress}>
                  {selectedLocation.DETAIL_ADDRESS}
                </div>
              </div>

              <div className={styles.branchStatus}>
                {getBranchStatusLabel(selectedLocation.STATUS_CODE)}
              </div>
            </div>

            <div className={styles.lockerStateHeader}>
              <div className={styles.lockerStateTitle}>보관함 상태</div>
            </div>

            <div className={styles.lockerGrid}>
              {lockerStates.map((locker) => (
                <div
                  key={`${locker.KIOSK_ID}-${locker.LOCKER_ID}`}
                  className={styles.lockerItem}
                >
                  <LockerStatusIcon
                    status={locker.LOCKER_STATUS}
                    className={styles.lockerIcon}
                  />

                  <div className={styles.lockerNo}>
                    {getLockerDisplayNo(locker)}번 보관함
                  </div>

                  <div
                    className={`${styles.lockerStatus} ${getLockerStatusTextClassName(
                      locker.LOCKER_STATUS,
                    )}`}
                  >
                    {getLockerStatusLabel(locker.LOCKER_STATUS)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!readonly && (
        <div className={styles.mapDrawerFooter}>
          <button
            type="button"
            className={styles.mapSelectButton}
            disabled={!selectedLocation || selecting}
            onClick={handleSelectLocationOnly}
          >
            {selecting ? "처리 중..." : selectButtonText}
          </button>
        </div>
      )}
    </aside>
  );
}
