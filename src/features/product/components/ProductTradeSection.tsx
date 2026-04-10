import styles from "./ProductTradeSection.module.css";

type ProductTradeSectionProps = {
  tradeType: string[];
  city: string | null;
  onTradeTypeChange: (value: string[]) => void;
};

export default function ProductTradeSection({
  tradeType,
  city,
  onTradeTypeChange,
}: ProductTradeSectionProps) {
  const isDeliveryTradeChecked = tradeType.includes("DELIVERY");
  const isDirectTradeChecked = tradeType.includes("DIRECT");
  const isLockerTradeChecked = tradeType.includes("LOCKER");

  const handleTradeTypeToggle = (type: string, checked: boolean) => {
    if (checked) {
      onTradeTypeChange([...tradeType, type]);
      return;
    }

    onTradeTypeChange(tradeType.filter((item) => item !== type));
  };

  return (
    <section className={styles.block}>
      <div className={styles.blockHeader}>
        <h1 className={styles.blockTitle}>거래방법</h1>
        <p className={styles.blockDescription}>
          구매자가 결제한 이후에는 거래 방법을 변경할 수 없어요.
        </p>
      </div>

      <div className={styles.mainDivider} />

      <section className={styles.tradeSection}>
        <div className={styles.tradeRow}>
          <div className={styles.tradeLabelBox}>
            <h2 className={styles.sectionLabel}>택배거래</h2>
          </div>

          <div className={styles.tradeContent}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={isDeliveryTradeChecked}
                onChange={(e) =>
                  handleTradeTypeToggle("DELIVERY", e.target.checked)
                }
              />
              <span className={styles.checkboxIcon}>
                <svg
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-4.47-2.47a.75.75 0 0 0-1.06-1.06l-4.97 4.97-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>택배거래</span>
            </label>
          </div>
        </div>

        <div className={styles.itemDivider} />

        <div className={styles.tradeRow}>
          <div className={styles.tradeLabelBox}>
            <h2 className={styles.sectionLabel}>직거래</h2>
          </div>

          <div className={styles.tradeContent}>
            <div className={styles.tradeOptionGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={isDirectTradeChecked}
                  onChange={(e) =>
                    handleTradeTypeToggle("DIRECT", e.target.checked)
                  }
                />
                <span className={styles.checkboxIcon}>
                  <svg
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-4.47-2.47a.75.75 0 0 0-1.06-1.06l-4.97 4.97-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>만나서 직거래</span>
              </label>

              {isDirectTradeChecked && (
                <div className={styles.locationButtonRow}>
                  <button type="button" className={styles.locationButton}>
                    {city ? city : "+ 위치 설정"}
                  </button>
                </div>
              )}
            </div>

            <div className={styles.itemDivider} />

            <div className={styles.tradeOptionGroup}>
              <div className={styles.tradeOptionHeader}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={isLockerTradeChecked}
                    onChange={(e) =>
                      handleTradeTypeToggle("LOCKER", e.target.checked)
                    }
                  />
                  <span className={styles.checkboxIcon}>
                    <svg
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-4.47-2.47a.75.75 0 0 0-1.06-1.06l-4.97 4.97-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span>보관함 거래</span>
                </label>

                <span className={styles.badge}>수수료 10%</span>
              </div>

              {isLockerTradeChecked && (
                <div className={styles.locationButtonRow}>
                  <button type="button" className={styles.locationButton}>
                    {city ? city : "+ 위치 설정"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
