import { Fragment, useState } from "react";
import styles from "../pages/ProductDetailPage.module.css";
import {
  getLocationText,
  getTradeLabel,
  getTradeTitle,
  getTradeTypes,
} from "../utils/productFormat";


type ProductTradeBoxProps = {
  tradeType?: string;
  state?: string | null;
  city?: string | null;
};


export default function ProductTradeBox({
  tradeType,
  state,
  city,
}: ProductTradeBoxProps) {
  const [isOpen, setIsOpen] = useState(true);

  const tradeTypes = getTradeTypes(tradeType);
  const locationText = getLocationText(state, city);
  const hasRegion = Boolean(locationText);
  const tradeTitle = getTradeTitle(tradeTypes, hasRegion);

  return (
    <div className={styles.tradeBox}>
      <button
        type="button"
        className={styles.tradeHeader}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={styles.tradeTitle}>
          {!hasRegion ? (
            "무료배송"
          ) : tradeTypes.length > 0 ? (
            tradeTypes.map((type, index) => (
              <Fragment key={type}>
                <span>{getTradeLabel(type)}</span>
                {index < tradeTypes.length - 1 && (
                  <span className={styles.tradeSeparator}>|</span>
                )}
              </Fragment>
            ))
          ) : (
            "거래 방식 정보 없음"
          )}
        </span>

        <span className={styles.tradeArrow}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className={styles.tradeTable}>
          {tradeTypes.length > 0 ? (
            tradeTypes.map((type) => (
              <div key={type} className={styles.tradeRow}>
                <span>{getTradeLabel(type)}</span>
                <strong>
                  {type === "DELIVERY"
                    ? "무료배송"
                    : locationText || "거래 지역 미정"}
                </strong>
              </div>
            ))
          ) : (
            <div className={styles.tradeRow}>
              <span>거래 방식</span>
              <strong>거래 방식 정보 없음</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}