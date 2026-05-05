import styles from "./ProductAccessorySection.module.css";

type ProductAccessorySectionProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ProductAccessorySection({
  value,
  onChange,
}: ProductAccessorySectionProps) {
  return (
    <section className={styles.sectionRow}>
      <div className={styles.sectionLabelBox}>
        <h2 className={styles.sectionLabel}>구성품</h2>
      </div>

      <div className={styles.sectionContent}>
        <div className={styles.optionColumn}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="accessory"
              className={styles.radioInput}
              checked={value === "NONE"}
              onChange={() => onChange("NONE")}
            />
            <span className={styles.radioMark} />

            <span className={styles.optionTextGroup}>
              <span className={styles.optionTitle}>없음</span>
              <span className={styles.optionDescription}>
                구매 시 포함되어 있던 구성품이 없는 상태
              </span>
            </span>
          </label>

          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="accessory"
              className={styles.radioInput}
              checked={value === "PARTIAL"}
              onChange={() => onChange("PARTIAL")}
            />
            <span className={styles.radioMark} />

            <span className={styles.optionTextGroup}>
              <span className={styles.optionTitle}>일부 포함</span>
              <span className={styles.optionDescription}>
                구매 시 포함되어 있던 구성품이 일부만 있는 상태
              </span>
            </span>
          </label>

          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="accessory"
              className={styles.radioInput}
              checked={value === "ALL"}
              onChange={() => onChange("ALL")}
            />
            <span className={styles.radioMark} />

            <span className={styles.optionTextGroup}>
              <span className={styles.optionTitle}>전체 포함</span>
              <span className={styles.optionDescription}>
                구매 시 포함되어 있던 모든 구성품이 있는 상태
              </span>
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
