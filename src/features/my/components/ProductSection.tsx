import React, { useMemo, useState } from 'react';
import styles from '../pages/MyPage.module.css';
import type { UserInfoProduct } from '../api/userInfoApi';

interface ProductSectionProps {
  products: UserInfoProduct[];
}

const tabLabels = ['전체'] as const;

const ProductSection: React.FC<ProductSectionProps> = ({ products }) => {
  const [selectedTab, setSelectedTab] = useState<string>('전체');
  const [sortOrder, setSortOrder] = useState<'latest' | 'low' | 'high'>('latest');

  const filteredProducts = useMemo(() => {
    if (selectedTab === '전체') return products;
    return products;
  }, [products, selectedTab]);

  const handleSelectProduct = (product: UserInfoProduct) => {
    // TODO: 제품 상세 페이지로 이동하는 등의 동작을 구현하세요.
    console.log('선택된 상품', product);
  };

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    if (sortOrder === 'low') {
      sorted.sort((a, b) => a.VIEW_COUNT - b.VIEW_COUNT);
    } else if (sortOrder === 'high') {
      sorted.sort((a, b) => b.VIEW_COUNT - a.VIEW_COUNT);
    }
    return sorted;
  }, [filteredProducts, sortOrder]);

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
          <div className={styles.productsCount}>총 {filteredProducts.length}개</div>
          <div className={styles.sortList}>
            <button
              type="button"
              className={`${styles.sortButton} ${sortOrder === 'latest' ? '' : styles.sortButtonInactive}`}
              onClick={() => setSortOrder('latest')}
            >
              최신순
            </button>
            <button
              type="button"
              className={`${styles.sortButton} ${sortOrder === 'low' ? '' : styles.sortButtonInactive}`}
              onClick={() => setSortOrder('low')}
            >
              낮은가격순
            </button>
            <button
              type="button"
              className={`${styles.sortButton} ${sortOrder === 'high' ? '' : styles.sortButtonInactive}`}
              onClick={() => setSortOrder('high')}
            >
              높은가격순
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.productTable}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.productCell}>상품</th>
              <th className={styles.productCell}>가격</th>
              <th className={styles.productCell}>상태</th>
              <th className={styles.productCell}>등록일</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {sortedProducts.length > 0 ? (
              sortedProducts.map((product, index) => (
                <tr
                  key={`${product.TITLE}-${index}`}
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
                  <td className={styles.priceCell}>-</td>
                  <td className={styles.productCell}>
                    <span
                      className={`${styles.statusBadge} ${
                        product.PRODUCT_STATUS_CODE === '판매중'
                          ? styles.statusSelling
                          : product.PRODUCT_STATUS_CODE === '예약중'
                            ? styles.statusReserved
                            : styles.statusSold
                      }`}
                    >
                      {product.PRODUCT_STATUS_CODE || '-'}
                    </span>
                  </td>
                  <td className={styles.dateCell}>-</td>
                </tr>
              ))
            ) : (
              <tr className={styles.tableRow}>
                <td colSpan={4} className={styles.emptyCell}>
                  선택된 조건에 해당하는 상품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductSection;
