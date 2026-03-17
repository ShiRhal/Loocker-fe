import React from 'react';
import MyDrawerLayout from './components/MyDrawerLayout';
import styles from './ReviewsDrawer.module.css';

interface ReviewsDrawerProps {
  onClose: () => void;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className={styles.emptyState}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.emptyIcon}
        aria-hidden="true"
      >
        <g clipPath="url(#clip0_1373_12999)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.95771e-06 24C7.69579e-06 10.7452 10.7452 -1.37836e-06 24 -8.87953e-07C37.2548 -3.9755e-07 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C19.5669 48 15.4145 46.798 11.8509 44.7023L2.55226 47.2382C1.43251 47.5436 0.405049 46.5162 0.710434 45.3964L3.25318 36.073C1.18492 32.5265 4.04847e-06 28.4016 4.95771e-06 24Z"
            fill="#DDE1E4"
          />
          <path
            d="M14 20.9996C15.656 20.9996 17 22.3436 17 23.9996C17 25.6556 15.656 26.9996 14 26.9996C12.344 26.9996 11 25.6556 11 23.9996C11 22.3436 12.344 20.9996 14 20.9996Z"
            fill="white"
          />
          <path
            d="M24 20.9996C25.656 20.9996 27 22.3436 27 23.9996C27 25.6556 25.656 26.9996 24 26.9996C22.344 26.9996 21 25.6556 21 23.9996C21 22.3436 22.344 20.9996 24 20.9996Z"
            fill="white"
          />
          <path
            d="M34 20.9996C35.656 20.9996 37 22.3436 37 23.9996C37 25.6556 35.656 26.9996 34 26.9996C32.344 26.9996 31 25.6556 31 23.9996C31 22.3436 32.344 20.9996 34 20.9996Z"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_1373_12999">
            <rect width="48" height="48" fill="white" transform="translate(48 48) rotate(-180)" />
          </clipPath>
        </defs>
      </svg>
      <p className={styles.emptyText}>{text}</p>
    </div>
  );
}

export default function ReviewsDrawer({ onClose }: ReviewsDrawerProps) {
  return (
    <MyDrawerLayout title="후기" onBack={onClose}>
      <main className={styles.innerMain}>
        <section className={styles.section}>
          <header className={styles.sectionHeader}>이런점이 좋았어요</header>
          <EmptyState text="받은 평가가 없습니다." />
        </section>

        <div className={styles.divider} />

        <section className={styles.section}>
          <header className={styles.sectionHeader}>상세한 후기도 있어요</header>
          <EmptyState text="작성된 후기가 없습니다." />
        </section>
      </main>
    </MyDrawerLayout>
  );
}

