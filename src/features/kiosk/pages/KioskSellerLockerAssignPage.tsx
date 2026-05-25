import { useLocation, useNavigate } from "react-router-dom";
import logoImage from "../../../assets/images/Loocker.png";
import styles from "../styles/kiosk.module.css";

type LockerAssignState = {
  TRADE_ID?: number;
  PRODUCT_ID?: number;
  TITLE?: string;
  PRODUCT_TITLE?: string;
  IMAGE_URL?: string;
  PRODUCT_IMAGE_URL?: string;
  THUMBNAIL_URL?: string;
  PRODUCT_IMG?: string;
  LOCKER_ID?: number;
  LOCKER_NO?: number;
  LOCKER_STATUS_CODE?: string;
  LOCKER_STATUS?: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function toApiAssetUrl(url?: string | null) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url}`;
}

const lockerStatusLabelMap: Record<string, string> = {
  EMPTY: "비어 있음",
  OPENED_FOR_SELLER: "판매자 입고 열림",
  SELLER_ITEM_CHECK: "판매자 물품 투입 확인",
  SELLER_PHOTO_CHECK: "입고 사진 확인",
  DEPOSIT_LOCKING: "입고 잠금 처리 중",
  LOCKED_WITH_ITEM: "입고 완료",
  ITEM_INSPECTION: "구매자 물품 확인",
  INSPECTION_CONFIRMED: "물품 확인 완료",
  OPENED_FOR_BUYER: "구매자 수령 열림",
  PICKUP_LOCKING: "수령 잠금 처리 중",
  PICKED_UP: "수령 완료",
  COMPLETED: "거래 완료",
  DISPUTED: "분쟁 상태",

  LO_01: "비어 있음",
  LO_02: "판매자 입고 열림",
  LO_03: "판매자 물품 투입 확인",
  LO_04: "입고 사진 확인",
  LO_05: "입고 잠금 처리 중",
  LO_06: "입고 완료",
  LO_07: "구매자 물품 확인",
  LO_08: "물품 확인 완료",
  LO_10: "구매자 수령 열림",
  LO_11: "수령 잠금 처리 중",
  LO_12: "수령 완료",
  LO_13: "거래 완료",
  LO_14: "분쟁 상태",
};

function getLockerStatusLabel(status?: string | null) {
  if (!status) return "-";
  return lockerStatusLabelMap[status] ?? status;
}

function getProductTitle(data?: LockerAssignState | null) {
  if (!data) return "-";
  return data.PRODUCT_TITLE || data.TITLE || "-";
}

function getProductImageUrl(data?: LockerAssignState | null) {
  if (!data) return "";

  return (
    data.IMAGE_URL ||
    data.PRODUCT_IMAGE_URL ||
    data.THUMBNAIL_URL ||
    data.PRODUCT_IMG ||
    ""
  );
}

export default function KioskSellerDepositLockerAssignPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const assignData = (location.state || {}) as LockerAssignState;

  const productTitle = getProductTitle(assignData);
  const productImageUrl = toApiAssetUrl(getProductImageUrl(assignData));

  const lockerNo = assignData.LOCKER_NO || assignData.LOCKER_ID || "-";

  const lockerStatus =
    assignData.LOCKER_STATUS ||
    assignData.LOCKER_STATUS_CODE ||
    "OPENED_FOR_SELLER";

  const handleGoHome = () => {
    navigate("/kiosk");
  };

  const handleReadyForNextStep = () => {
    alert(
      "다음 단계에서 라즈베리파이 명령 INSERT API와 명령 완료 상태 polling을 연결합니다.",
    );
  };

  return (
    <div className={styles.productPage}>
      <header className={styles.authHeader}>
        <img src={logoImage} alt="루커" className={styles.authLogo} />

        <button
          type="button"
          className={styles.authHomeButton}
          onClick={handleGoHome}
        >
          처음으로
        </button>
      </header>

      <main>
        <section className={styles.productCard}>
          <h1 className={styles.authTitle}>보관함 배정 완료</h1>

          <p className={styles.authDescription}>
            지정된 보관함에 물품을 보관해주세요.
          </p>

          <div className={styles.lockerAssignProductBox}>
            <div className={styles.lockerAssignProductImageBox}>
              {productImageUrl ? (
                <img
                  src={productImageUrl}
                  alt={productTitle}
                  className={styles.lockerAssignProductImage}
                />
              ) : (
                <div className={styles.lockerAssignNoImage}>이미지 없음</div>
              )}
            </div>

            <div className={styles.lockerAssignProductInfo}>
              <span>선택 상품</span>
              <strong>{productTitle}</strong>
            </div>
          </div>

          <div className={styles.kioskLockerResultBox}>
            <p className={styles.kioskLockerResultLabel}>지정된 보관함</p>

            <strong className={styles.kioskLockerResultNumber}>
              {lockerNo}번
            </strong>

            <p className={styles.kioskLockerResultText}>
              {lockerNo}번 보관함이 지정되었습니다.
            </p>

            <p className={styles.kioskLockerResultSubText}>
              해당 보관함에 물품을 넣은 뒤, 문을 닫고 다음 안내를 기다려주세요.
            </p>

            <p className={styles.kioskLockerStatusKorean}>
              상태: {getLockerStatusLabel(lockerStatus)}
            </p>
          </div>

          <div className={styles.progressNoticeBox}>
            <h2>입고 안내</h2>
            <p>
              현재는 보관함 배정 결과만 표시합니다. 이후 이 화면에서
              라즈베리파이 명령 생성 API 호출과 명령 완료 상태 polling을
              연결하면 됩니다.
            </p>
          </div>

          <button
            type="button"
            className={styles.primaryWideButton}
            onClick={handleReadyForNextStep}
          >
            물품을 보관했습니다
          </button>
        </section>
      </main>
    </div>
  );
}
