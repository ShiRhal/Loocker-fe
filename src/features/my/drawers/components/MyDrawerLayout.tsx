import React from 'react';
import styles from './MyDrawerLayout.module.css';

type MyDrawerLayoutProps = {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  mainClassName?: string;
  headerAction?: React.ReactNode;
};

export default function MyDrawerLayout({
  title,
  onBack,
  children,
  footer,
  mainClassName,
  headerAction,
}: MyDrawerLayoutProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack} aria-label="뒤로가기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12.5 19.5L4.42491 12.3749C4.19932 12.1759 4.19932 11.8241 4.42491 11.6251L12.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className={styles.title}>{title}</h1>
        {headerAction ? <div className={styles.headerAction}>{headerAction}</div> : null}
      </header>

      <main className={mainClassName ? `${styles.main} ${mainClassName}` : styles.main}>{children}</main>

      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}

