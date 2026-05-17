import { useState } from "react";
import styles from "./ProductTradeSection.module.css";
import DirectLocationDrawer from "./DirectLocationDrawer";
import LockerTradeDrawer from "./LockerTradeDrawer";

type ProductTradeSectionProps = {
  tradeType: string[];
  city: string | null;
  onTradeTypeChange: (value: string[]) => void;
  onCityChange: (value: string | null) => void;
};

export default function ProductTradeSection({
  tradeType,
  city,
  onTradeTypeChange,
  onCityChange,
}: ProductTradeSectionProps) {
  const [activeDrawer, setActiveDrawer] = useState<
    "direct-location" | "locker" | null
  >(null);

  const isDirectChecked = tradeType.includes("DIRECT");
  const isLockerChecked = tradeType.includes("LOCKER");
  const isDeliveryChecked = tradeType.includes("DELIVERY");

  const openDrawer = (drawer: "direct-location" | "locker") => {
    setActiveDrawer(drawer);
  };

  const closeDrawer = () => {
    setActiveDrawer(null);
  };

  const handleTradeTypeChange = (type: string) => {
    const wasChecked = tradeType.includes(type);

    const nextTradeType = wasChecked
      ? tradeType.filter((item) => item !== type)
      : [...tradeType, type];

    onTradeTypeChange(nextTradeType);

    if (wasChecked) return;

    if (type === "DIRECT") {
      openDrawer("direct-location");
    }

    if (type === "LOCKER") {
      openDrawer("locker");
    }
  };

  const handleCitySelect = (selectedCity: string) => {
    onCityChange(selectedCity);
    closeDrawer();
  };

  const handleRemoveCity = () => {
    onCityChange(null);
  };

  return (
    <>
      <section className={styles.block}>
        <div className={styles.blockHeader}>
          <h2 className={styles.blockTitle}>거래방법</h2>
          <p className={styles.blockDescription}>
            구매자가 결제한 이후에는 거래 방법을 변경할 수 없어요.
          </p>
        </div>

        <div className={styles.mainDivider} />

        <div className={styles.tradeSection}>
          <div className={styles.tradeRow}>
            <div className={styles.tradeLabelBox}>
              <h3 className={styles.sectionLabel}>택배거래</h3>
            </div>

            <div className={styles.tradeContent}>
              <div className={styles.tradeOptionGroup}>
                <div className={styles.tradeOptionHeader}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={isDeliveryChecked}
                      onChange={() => handleTradeTypeChange("DELIVERY")}
                    />
                    <span className={styles.checkboxIcon}>✓</span>
                    택배거래
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.itemDivider} />

          <div className={styles.tradeRow}>
            <div className={styles.tradeLabelBox}>
              <h3 className={styles.sectionLabel}>직거래</h3>
            </div>

            <div className={styles.tradeContent}>
              <div className={styles.tradeOptionGroup}>
                <div className={styles.tradeOptionHeader}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={isDirectChecked}
                      onChange={() => handleTradeTypeChange("DIRECT")}
                    />
                    <span className={styles.checkboxIcon}>✓</span>
                    만나서 직거래
                  </label>
                </div>

                {isDirectChecked && (
                  <div className={styles.locationButtonRow}>
                    {city && (
                      <span className={styles.selectedCityChip}>
                        {city}
                        <button
                          type="button"
                          className={styles.selectedCityRemoveButton}
                          onClick={handleRemoveCity}
                          aria-label={`${city} 위치 삭제`}
                        >
                          ×
                        </button>
                      </span>
                    )}

                    <button
                      type="button"
                      className={styles.locationButton}
                      onClick={() => openDrawer("direct-location")}
                    >
                      + 위치 설정
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.itemDivider} />

          <div className={styles.tradeRow}>
            <div className={styles.tradeLabelBox} />

            <div className={styles.tradeContent}>
              <div className={styles.tradeOptionGroup}>
                <div className={styles.tradeOptionHeader}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={isLockerChecked}
                      onChange={() => handleTradeTypeChange("LOCKER")}
                    />
                    <span className={styles.checkboxIcon}>✓</span>
                    보관함 거래
                  </label>

                  <span className={styles.badge}>수수료 10%</span>
                </div>

                {isLockerChecked && (
                  <div className={styles.locationButtonRow}>
                    <button
                      type="button"
                      className={styles.locationButton}
                      onClick={() => openDrawer("locker")}
                    >
                      + 보관함 설정
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {activeDrawer && (
        <div className={styles.drawerOverlay}>
          <aside className={styles.drawerPanel}>
            {activeDrawer === "direct-location" && (
              <DirectLocationDrawer
                selectedCity={city ?? ""}
                onBack={closeDrawer}
                onSelectCity={handleCitySelect}
              />
            )}

            {activeDrawer === "locker" && (
              <LockerTradeDrawer onBack={closeDrawer} />
            )}
          </aside>
        </div>
      )}
    </>
  );
}