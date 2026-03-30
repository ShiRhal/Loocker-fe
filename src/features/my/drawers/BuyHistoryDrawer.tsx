import React, { useState } from 'react';
import styles from './BuyHistoryDrawer.module.css';
import MyDrawerLayout from './components/MyDrawerLayout';
import type { UserInfoBuy } from '../api/userInfoApi';

interface BuyHistoryDrawerProps {
  onClose: () => void;
  buyList: UserInfoBuy[];
}

const BuyHistoryDrawer: React.FC<BuyHistoryDrawerProps> = ({ onClose, buyList }) => {
  const [searchWord, setSearchWord] = useState('');

  return (
    <MyDrawerLayout title="구매 내역" onBack={onClose} mainClassName={styles.main}>
      <div role="main" aria-label="본문 영역">
        <div className={styles.searchSection}>
          <div className={styles.search}>
            <button type="submit" className={styles.submitSearch}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke="currentColor"
                  d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  stroke="currentColor"
                  d="M21 21L17 17"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <input
              type="search"
              id="searchWord"
              placeholder="상품명을 입력해주세요."
              autoComplete="off"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
            />
          </div>
          <button type="button" className={styles.filterButton} aria-label="상세 필터 선택하기 버튼">
            <span className={styles.filterText}>상세필터</span>
          </button>
        </div>

        <div className={styles.content}>
          {buyList.length > 0 ? (
            <table className={styles.listTable}>
              <thead>
                <tr>
                  <th>상품</th>
                  <th>상태</th>
                  <th>조회수</th>
                  <th>판매자</th>
                  <th>완료일</th>
                </tr>
              </thead>
              <tbody>
                {buyList.map((item, index) => (
                  <tr
                    key={item.TRADE_ID ?? `${item.TITLE}-${index}`}
                    className={styles.listRow}
                    onClick={() => {
                      console.log('구매 내역 클릭', item);
                      // TODO: 상세 페이지 이동 (예: navigate(`/trades/${item.TRADE_ID}`))
                    }}
                  >
                    <td className={styles.titleCell}>
                      {item.TITLE || '-'}
                    </td>
                    <td>{item.PRODUCT_STATUS_CODE || '-'}</td>
                    <td>{item.VIEW_COUNT ?? 0}</td>
                    <td>{item.SELLER_NICKNAME || '-'}</td>
                    <td>{item.COMPLETED_AT || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
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
              <p>최근 구매 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </MyDrawerLayout>
  );
};

export default BuyHistoryDrawer;
