import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FavoritesDrawer.module.css';
import DrawerLayout from '../../../shared/components/DrawerLayout/DrawerLayout';
import MyPageProductCard from '../components/MyPageProductCard';
import type { UserInfoSale } from '../api/userInfoApi';

interface SellHistoryDrawerProps {
  onClose: () => void;
  sellList: UserInfoSale[];
}

type ProductStatusCode = 'SALE' | 'SOLD' | 'TRADING';

const STATUS_LABEL_MAP: Record<ProductStatusCode, string> = {
  SALE: '판매중',
  SOLD: '판매 완료',
  TRADING: '거래중',
};

const normalizeStatusCode = (statusCode?: string): ProductStatusCode | null => {
  if (statusCode === 'SALE' || statusCode === '판매중') return 'SALE';
  if (statusCode === 'SOLD' || statusCode === '판매 완료') return 'SOLD';
  if (statusCode === 'TRADING' || statusCode === '거래중') return 'TRADING';
  return null;
};

const getStatusBadgeVariant = (statusCode: ProductStatusCode | null) => {
  if (statusCode === 'SALE') return 'green';
  if (statusCode === 'TRADING') return 'yellow';
  return 'gray';
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const getOptionalCount = (item: unknown, key: string) => {
  const value = (item as Record<string, unknown>)[key];
  const numberValue = Number(value ?? 0);
  return Number.isNaN(numberValue) ? 0 : numberValue;
};

const SellHistoryDrawer: React.FC<SellHistoryDrawerProps> = ({ onClose, sellList }) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const goToProductDetail = (productId?: number) => {
    if (productId == null) return;
    onClose();
    navigate(`/product/${productId}`);
  };

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredSellList = sellList.filter((item) =>
    item.TITLE.toLowerCase().includes(normalizedKeyword),
  );

  return (
    <DrawerLayout title="판매 내역" onBack={onClose} mainClassName={styles.content}>
      <div className={styles.scrollArea}>
        <div className={styles.searchSection}>
          <form className={styles.search} onSubmit={(e) => e.preventDefault()}>
            <button type="submit" aria-label="검색">
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
            <ul className={styles.cardList}>
              {filteredSellList.map((item, index) => {
                const statusCode = normalizeStatusCode(item.PRODUCT_STATUS_CODE);
                const statusLabel = statusCode
                  ? STATUS_LABEL_MAP[statusCode]
                  : item.PRODUCT_STATUS_CODE || '-';

                return (
                  <li
                    key={item.TRADE_ID ?? `${item.TITLE}-${index}`}
                    className={styles.cardListItem}
                  >
                    <MyPageProductCard
                      compact
                      imageUrl={item.IMAGE_URL}
                      title={item.TITLE || '-'}
                      nickname={`구매자 ${item.BUYER_NICKNAME || '-'}`}
                      price={item.BASE_PRICE ?? 0}
                      createdAt={formatDate(item.CREATED_AT || item.COMPLETED_AT)}
                      viewCount={item.VIEW_COUNT ?? 0}
                      chatCount={getOptionalCount(item, 'CHAT_COUNT')}
                      wishCount={getOptionalCount(item, 'WISH_COUNT')}
                      badges={[
                        {
                          label: statusLabel,
                          variant: getStatusBadgeVariant(statusCode),
                        },
                      ]}
                      onClick={() => goToProductDetail(item.PRODUCT_ID)}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.emptyState}>
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