import React from "react";
import styles from "./MyPageProductCard.module.css";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";

type CardBadge = {
  label: string;
  variant?: "blue" | "gray" | "green" | "yellow" | "red";
};

interface MyPageProductCardProps {
  imageUrl?: string;
  title: string;
  nickname?: string;
  price?: number;
  createdAt?: string;
  viewCount?: number;
  chatCount?: number;
  wishCount?: number;
  badges?: CardBadge[];
  compact?: boolean;
  rightSlot?: React.ReactNode;
  onClick?: () => void;
}

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22%23eef0f3%22/%3E%3Ctext x=%2240%22 y=%2245%22 font-size=%2212%22 text-anchor=%22middle%22 fill=%22%239ca3af%22%3E%3F%3C/text%3E%3C/svg%3E";

function formatPrice(price?: number) {
  if (price == null) return "-";
  return `${price.toLocaleString()}원`;
}

const MyPageProductCard: React.FC<MyPageProductCardProps> = ({
  imageUrl,
  title,
  nickname,
  price,
  createdAt,
  viewCount = 0,
  chatCount = 0,
  wishCount = 0,
  badges = [],
  compact = false,
  rightSlot,
  onClick,
}) => {
  return (
    <button
      type="button"
      className={`${styles.card} ${compact ? styles.compact : ""}`}
      onClick={onClick}
    >
      <div className={styles.imageBox}>
        <img
          src={imageUrl ? toApiAssetUrl(imageUrl) : fallbackImage}
          alt={title}
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />
      </div>

      <div className={styles.infoArea}>
        {badges.length > 0 && (
          <div className={styles.badgeRow}>
            {badges.map((badge) => (
              <span
                key={`${badge.label}-${badge.variant ?? "gray"}`}
                className={`${styles.badge} ${styles[badge.variant ?? "gray"]}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}

        <strong className={styles.title}>{title || "-"}</strong>

        {nickname && <span className={styles.nickname}>{nickname}</span>}

        <strong className={styles.price}>{formatPrice(price)}</strong>
      </div>

      <div className={styles.metaArea}>
        <div className={styles.statsRow}>
          <div className={styles.stats}>
            <span className={styles.statItem}>
              <svg
                className={styles.statIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 5C6.5 5 2.3 9.1 1 12c1.3 2.9 5.5 7 11 7s9.7-4.1 11-7c-1.3-2.9-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.8a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" />
              </svg>
              {viewCount}
            </span>

            <span className={styles.statItem}>
              <svg
                className={styles.statIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4.5 4v-4.5A2.5 2.5 0 0 1 4 12.5z" />
              </svg>
              {chatCount}
            </span>

            <span className={styles.statItem}>
              <svg
                className={styles.statIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 21s-6.716-4.35-9.193-8.077C.91 10.064 1.37 5.97 4.59 4.09c2.02-1.18 4.57-.78 6.41.9l1 0 1-1c1.84-1.68 4.39-2.08 6.41-.9 3.22 1.88 3.68 5.974 1.783 8.833C18.716 16.65 12 21 12 21z" />
              </svg>
              {wishCount}
            </span>
          </div>

          {rightSlot && <div>{rightSlot}</div>}
        </div>

        <span className={styles.createdAt}>{createdAt || "-"}</span>
      </div>
    </button>
  );
};

export default MyPageProductCard;
