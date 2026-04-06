import React, { useState } from 'react';
import styles from './TradeStatusDrawer.module.css';
import DrawerLayout from '../../../shared/components/DrawerLayout/DrawerLayout';

interface TradeStatusDrawerProps {
  onClose: () => void;
}

const TradeStatusDrawer: React.FC<TradeStatusDrawerProps> = ({ onClose }) => {
  const [keyword, setKeyword] = useState('');

  return (
    <DrawerLayout title="거래 상태" onBack={onClose} mainClassName={styles.content}>
        <div className={styles.scrollArea}>
          <div className={styles.searchSection}>
            <form className={styles.search}>
              <button type="submit">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.0278 19.0556C14.3233 19.0556 17.8056 15.5733 17.8056 11.2778C17.8056 6.98223 14.3233 3.5 10.0278 3.5C5.73223 3.5 2.25 6.98223 2.25 11.2778C2.25 15.5733 5.73223 19.0556 10.0278 19.0556Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="transparent"
                  />
                  <path
                    d="M21 21.8999L15.5 16.8999"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <input
                id="keyword"
                type="search"
                autoComplete="off"
                className={styles.searchInput}
                placeholder="상품명을 입력해주세요"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </form>
          </div>

          <div className={styles.listContainer}>
            <ul className={styles.productList}></ul>
            <div id="observer" className={styles.observer} aria-hidden="true"></div>
            <div className={styles.emptyState}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 26 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 3.5H7C6.46957 3.5 5.96086 3.70018 5.58579 4.0565C5.21071 4.41282 5 4.89609 5 5.4V20.6C5 21.1039 5.21071 21.5872 5.58579 21.9435C5.96086 22.2998 6.46957 22.5 7 22.5H19C19.5304 22.5 20.0391 22.2998 20.4142 21.9435C20.7893 21.5872 21 21.1039 21 20.6V9.2L15 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 4V9.5C15 9.77614 15.2239 10 15.5 10H21"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 14H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 18H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 10H10H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>거래 중인 상품이 없습니다.</p>
            </div>
          </div>
        </div>
    </DrawerLayout>
  );
};

export default TradeStatusDrawer;
