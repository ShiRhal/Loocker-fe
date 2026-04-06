import React, { useEffect, useMemo, useState } from 'react';
import styles from '../pages/MyPage.module.css';
import type { UserInfoProduct } from '../api/userInfoApi';

interface ProductSectionProps {
  products: UserInfoProduct[];
}

const tabLabels = ['전체'] as const;

type SortOrder = 'none' | 'asc' | 'desc';
type ProductStatusFilter = 'SALE' | 'SOLD' | 'TRADING' | null;

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

const ProductSection: React.FC<ProductSectionProps> = ({ products }) => {
  const [selectedTab, setSelectedTab] = useState<string>('전체');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [priceSort, setPriceSort] = useState<SortOrder>('none');
  const [dateSort, setDateSort] = useState<SortOrder>('none');
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserInfoProduct | null>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-row-menu-trigger="true"]')) return;
      if (target.closest('[data-row-menu="true"]')) return;
      setOpenMenuKey(null);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const tabFilteredProducts = useMemo(() => {
    if (selectedTab === '전체') return products;
    return products;
  }, [products, selectedTab]);

  const handleSelectProduct = (product: UserInfoProduct) => {
    // TODO: 제품 상세 페이지로 이동하는 등의 동작을 구현하세요.
    console.log('선택된 상품', product);
  };

  const visibleProducts = useMemo(() => {
    let next = [...tabFilteredProducts];
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    if (normalizedKeyword) {
      next = next.filter((product) => product.TITLE.toLowerCase().includes(normalizedKeyword));
    }

    if (statusFilter) {
      next = next.filter((product) => normalizeStatusCode(product.PRODUCT_STATUS_CODE) === statusFilter);
    }

    if (priceSort !== 'none') {
      next.sort((a, b) => {
        const aPrice = Number(a.BASE_PRICE ?? 0);
        const bPrice = Number(b.BASE_PRICE ?? 0);
        return priceSort === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      });
    } else if (dateSort !== 'none') {
      next.sort((a, b) => {
        const aDate = new Date(a.CREATED_AT ?? '').getTime();
        const bDate = new Date(b.CREATED_AT ?? '').getTime();
        const safeADate = Number.isNaN(aDate) ? 0 : aDate;
        const safeBDate = Number.isNaN(bDate) ? 0 : bDate;
        return dateSort === 'asc' ? safeADate - safeBDate : safeBDate - safeADate;
      });
    }

    return next;
  }, [tabFilteredProducts, searchKeyword, statusFilter, priceSort, dateSort]);

  const setColumnSort = (target: 'price' | 'date', direction: 'asc' | 'desc') => {
    if (target === 'price') {
      setPriceSort((prev) => (prev === direction ? 'none' : direction));
      setDateSort('none');
      return;
    }
    setDateSort((prev) => (prev === direction ? 'none' : direction));
    setPriceSort('none');
  };

  const handleEditProduct = (product: UserInfoProduct) => {
    console.log('수정 클릭', product);
    if (!product.PRODUCT_ID) return;
    window.location.href = `/product/form?type=edit&productId=${product.PRODUCT_ID}`;
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    console.log('삭제 확인 클릭', deleteTarget);
    setDeleteTarget(null);
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  };

  return (
    <div className={styles.productsSection}>
      <div className={styles.productsHeader}>
        <h3 className={styles.productsTitle}>내 상품</h3>
        <div className={styles.productsTabs}>
          <div className={styles.productsTabList}>
            {tabLabels.map((label) => (
              <button
                key={label}
                type="button"
                className={`${styles.productsTab} ${selectedTab === label ? '' : styles.productsTabInactive}`}
                onClick={() => setSelectedTab(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.productsControls}>
          <div className={styles.productsCount}>총 {visibleProducts.length}개</div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.productTable}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.productCell}>
                <div className={styles.headerCellInline}>
                  <span>상품</span>
                  <div className={styles.underlinedSearchBox}>
                    <input
                      type="search"
                      className={styles.tableSearchInput}
                      placeholder="검색"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.searchIcon}
                    >
                      <path
                        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M21 21L17 17"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </th>
              <th className={styles.productCell}>
                <div className={styles.headerSortButton}>
                  가격
                  <span className={styles.sortArrows}>
                    <button
                      type="button"
                      className={`${styles.sortArrowButton} ${priceSort === 'asc' ? styles.sortArrowActive : ''}`}
                      onClick={() => setColumnSort('price', 'asc')}
                      aria-label="가격 오름차순"
                    >
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`${styles.sortArrowButton} ${priceSort === 'desc' ? styles.sortArrowActive : ''}`}
                      onClick={() => setColumnSort('price', 'desc')}
                      aria-label="가격 내림차순"
                    >
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </span>
                </div>
              </th>
              <th className={styles.productCell}>
                <div className={styles.headerCellInline}>
                  <span>상태</span>
                  <button
                    type="button"
                    className={`${styles.statusFilterButton} ${statusFilter ? styles.statusFilterButtonActive : ''}`}
                    onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                  >
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {isStatusDropdownOpen ? (
                    <div className={styles.statusDropdown}>
                      {(Object.keys(STATUS_LABEL_MAP) as Array<'SALE' | 'SOLD' | 'TRADING'>).map((code) => (
                        <button
                          key={code}
                          type="button"
                          className={`${styles.statusOption} ${statusFilter === code ? styles.statusOptionActive : ''}`}
                          onClick={() => {
                            setStatusFilter((prev) => (prev === code ? null : code));
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          {STATUS_LABEL_MAP[code]}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </th>
              <th className={styles.productCell}>
                <div className={styles.headerSortButton}>
                  등록일
                  <span className={styles.sortArrows}>
                    <button
                      type="button"
                      className={`${styles.sortArrowButton} ${dateSort === 'asc' ? styles.sortArrowActive : ''}`}
                      onClick={() => setColumnSort('date', 'asc')}
                      aria-label="등록일 오름차순"
                    >
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`${styles.sortArrowButton} ${dateSort === 'desc' ? styles.sortArrowActive : ''}`}
                      onClick={() => setColumnSort('date', 'desc')}
                      aria-label="등록일 내림차순"
                    >
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </span>
                </div>
              </th>
              <th className={styles.actionHeaderCell}></th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {visibleProducts.length > 0 ? (
              visibleProducts.map((product, index) => {
                const statusCode = normalizeStatusCode(product.PRODUCT_STATUS_CODE);
                const rowKey = product.PRODUCT_ID ? String(product.PRODUCT_ID) : `${product.TITLE}-${index}`;
                const isSale = statusCode === 'SALE';
                return (
                <tr
                  key={rowKey}
                  className={styles.tableRow}
                  onClick={() => handleSelectProduct(product)}
                  tabIndex={0}
                  role="button"
                >
                  <td className={styles.productCell}>
                    <div className={styles.productInfo}>
                      <img
                        src={product.IMAGE_URL}
                        alt={product.TITLE}
                        className={styles.productImage}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src =
                            'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%23e5e7eb%22/%3E%3Ctext x=%2232%22 y=%2236%22 font-size=%2212%22 text-anchor=%22middle%22 fill=%22%23787689%22%3E%3F%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <span className={styles.productName}>{product.TITLE || '-'}</span>
                    </div>
                  </td>
                  <td className={styles.priceCell}>{(product.BASE_PRICE ?? 0).toLocaleString()}원</td>
                  <td className={styles.productCell}>
                    <span
                      className={`${styles.statusBadge} ${
                        statusCode === 'SALE'
                          ? styles.statusSelling
                          : statusCode === 'TRADING'
                            ? styles.statusReserved
                            : styles.statusSold
                      }`}
                    >
                      {statusCode ? STATUS_LABEL_MAP[statusCode] : product.PRODUCT_STATUS_CODE || '-'}
                    </span>
                  </td>
                  <td className={styles.dateCell}>{formatDate(product.CREATED_AT)}</td>
                  <td
                    className={styles.actionCell}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <button
                      type="button"
                      className={styles.moreButton}
                      data-row-menu-trigger="true"
                      onClick={() => setOpenMenuKey((prev) => (prev === rowKey ? null : rowKey))}
                    >
                      ⋮
                    </button>
                    {openMenuKey === rowKey ? (
                      <div className={styles.rowMenu} data-row-menu="true">
                        {isSale ? (
                          <button
                            type="button"
                            className={styles.rowMenuButton}
                            onClick={() => {
                              setOpenMenuKey(null);
                              handleEditProduct(product);
                            }}
                          >
                            수정
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={styles.rowMenuButton}
                          onClick={() => {
                            setOpenMenuKey(null);
                            setDeleteTarget(product);
                          }}
                        >
                          삭제하기
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
              })
            ) : (
              <tr className={styles.tableRow}>
                <td colSpan={5} className={styles.emptyCell}>
                  선택된 조건에 해당하는 상품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {deleteTarget ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <p className={styles.modalTitle}>정말 삭제하시겠어요?</p>
            <p className={styles.modalDescription}>삭제 후에는 되돌릴 수 없습니다.</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalCancelButton} onClick={() => setDeleteTarget(null)}>
                취소
              </button>
              <button type="button" className={styles.modalConfirmButton} onClick={handleDeleteConfirm}>
                삭제하기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductSection;
