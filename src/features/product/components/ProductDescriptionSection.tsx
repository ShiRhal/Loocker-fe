import styles from "../pages/ProductDetailPage.module.css";

type ProductDescriptionSectionProps = {
  description?: string;
};

export default function ProductDescriptionSection({
  description,
}: ProductDescriptionSectionProps) {
  return (
    <section className={styles.descriptionSection}>
      <h2 className={styles.sectionTitle}>상품 정보</h2>
      <p className={styles.description}>{description || "상품 설명이 없습니다."}</p>
    </section>
  );
}