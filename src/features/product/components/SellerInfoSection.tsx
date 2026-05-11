import styles from "../pages/ProductDetailPage.module.css";

type SellerInfoSectionProps = {
  nickname?: string;
};

export default function SellerInfoSection({ nickname }: SellerInfoSectionProps) {
  return (
    <aside className={styles.sellerSection}>
      <h2 className={styles.sectionTitle}>판매자 정보</h2>

      <div className={styles.sellerCard}>
        <div className={styles.sellerAvatar}>{nickname?.slice(0, 1) ?? "?"}</div>

        <strong className={styles.sellerName}>
          {nickname ?? "판매자 정보 없음"}
        </strong>
      </div>
    </aside>
  );
}