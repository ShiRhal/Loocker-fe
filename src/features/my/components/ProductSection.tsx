import React, { useMemo, useState } from 'react';
import styles from '../pages/MyPage.module.css';

type Product = {
  id: number;
  name: string;
  price: number;
  status: '판매중' | '예약중' | '판매완료';
  date: string;
  image: string;
};

const mockProducts: Product[] = [
  {
    id: 1,
    name: '아이폰 14 프로',
    price: 1200000,
    status: '판매중',
    date: '2024-03-10',
    image: 'https://img2.joongna.com/images/item/202403/10/1710051234567.jpg'
  },
  {
    id: 2,
    name: '삼성 갤럭시 S23',
    price: 900000,
    status: '예약중',
    date: '2024-03-08',
    image: 'https://img2.joongna.com/images/item/202403/08/1710051234568.jpg'
  },
  {
    id: 3,
    name: '맥북 프로 16인치',
    price: 2500000,
    status: '판매완료',
    date: '2024-03-05',
    image: 'https://img2.joongna.com/images/item/202403/05/1710051234569.jpg'
  }
];

const tabLabels = ['전체', '판매중', '예약중', '판매완료'] as const;

const ProductSection: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('전체');
  const [sortOrder, setSortOrder] = useState<'latest' | 'low' | 'high'>('latest');

  const filteredProducts = useMemo(() => {
    if (selectedTab === '전체') return mockProducts;
    return mockProducts.filter((product) => product.status === selectedTab);
  }, [selectedTab]);

  const handleSelectProduct = (product: Product) => {
    // TODO: 제품 상세 페이지로 이동하는 등의 동작을 구현하세요.
    console.log('선택된 상품', product);
  };

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    if (sortOrder === 'latest') {
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortOrder === 'low') {
      sorted.sort((a, b) => a.price - b.price);
    } else {
      sorted.sort((a, b) => b.price - a.price);
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
              sortedProducts.map((product) => (
                <tr
                  key={product.id}
                  className={styles.tableRow}
                  onClick={() => handleSelectProduct(product)}
                  tabIndex={0}
                  role="button"
                >
                  <td className={styles.productCell}>
                    <div className={styles.productInfo}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className={styles.productImage}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src =
                            'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%23e5e7eb%22/%3E%3Ctext x=%2232%22 y=%2236%22 font-size=%2212%22 text-anchor=%22middle%22 fill=%22%23787689%22%3E%3F%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <span className={styles.productName}>{product.name}</span>
                    </div>
                  </td>
                  <td className={styles.priceCell}>{product.price.toLocaleString()}원</td>
                  <td className={styles.productCell}>
                    <span
                      className={`${styles.statusBadge} ${
                        product.status === '판매중'
                          ? styles.statusSelling
                          : product.status === '예약중'
                          ? styles.statusReserved
                          : styles.statusSold
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className={styles.dateCell}>{product.date}</td>
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
