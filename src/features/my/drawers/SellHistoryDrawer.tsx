import React, { useState } from 'react';
import styles from './FavoritesDrawer.module.css';
import DrawerLayout from '../../../shared/components/DrawerLayout/DrawerLayout';
import type { UserInfoSale } from '../api/userInfoApi';

interface SellHistoryDrawerProps {
  onClose: () => void;
  sellList: UserInfoSale[];
}

const SellHistoryDrawer: React.FC<SellHistoryDrawerProps> = ({ onClose, sellList }) => {
  const STATUS_LABEL_MAP: Record<'SALE' | 'SOLD' | 'TRADING', string> = {
    SALE: '판매중',
    SOLD: '판매 완료',
    TRADING: '거래중',
  };

  const normalizeStatusCode = (statusCode: string): 'SALE' | 'SOLD' | 'TRADING' | null => {
    if (statusCode === 'SALE' || statusCode === '판매중') return 'SALE';
    if (statusCode === 'SOLD' || statusCode === '판매 완료') return 'SOLD';
    if (statusCode === 'TRADING' || statusCode === '거래중') return 'TRADING';
    return null;
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  };

  const [keyword, setKeyword] = useState('');
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredSellList = sellList.filter((item) =>
    item.TITLE.toLowerCase().includes(normalizedKeyword),
  );

  return (
    <DrawerLayout title="판매 내역" onBack={onClose} mainClassName={styles.content}>
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
          {filteredSellList.length > 0 ? (
            <table className={styles.listTable}>
              <thead>
                <tr>
                  <th>상품</th>
                  <th>상태</th>
                  <th>구매자</th>
                  <th>가격</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellList.map((item, index) => {
                  const statusCode = normalizeStatusCode(item.PRODUCT_STATUS_CODE);
                  return (
                    <tr
                      key={item.TRADE_ID ?? `${item.TITLE}-${index}`}
                      className={styles.listRow}
                      onClick={() => {
                        console.log('판매 내역 클릭', item);
                      }}
                    >
                      <td className={styles.titleCell}>
                        <div className={styles.productInfo}>
                          <img
                            src={item.IMAGE_URL}
                            alt={item.TITLE}
                            className={styles.productImage}
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src =
                                'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%23e5e7eb%22/%3E%3Ctext x=%2232%22 y=%2236%22 font-size=%2212%22 text-anchor=%22middle%22 fill=%22%23787689%22%3E%3F%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <span>{item.TITLE || '-'}</span>
                        </div>
                      </td>
                      <td>{statusCode ? STATUS_LABEL_MAP[statusCode] : item.PRODUCT_STATUS_CODE || '-'}</td>
                      <td>{item.BUYER_NICKNAME || '-'}</td>
                      <td>{(item.BASE_PRICE ?? 0).toLocaleString()}원</td>
                      <td>{formatDate(item.CREATED_AT || item.COMPLETED_AT)}</td>
                    </tr>
                  );
                })}
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
              <p>최근 판매 내역이 없습니다.</p>
            </div>
          )}
          <div id="observer" className={styles.observer} aria-hidden="true"></div>
        </div>
      </div>
    </DrawerLayout>
  );
};

export default SellHistoryDrawer;
