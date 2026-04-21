import React from 'react';
import styles from '../pages/MyPage.module.css';

interface MyPageMobileProps {
  setDrawerType: (type: string) => void;
}

const MyPageMenuMobile: React.FC<MyPageMobileProps> = ({ setDrawerType }) => {
  return (
    <>
      {/* 모바일 메뉴 */}
      <div className={styles.mobileMenuDivider}></div>
      <div className={styles.mobileMenu}>
        <ul className={styles.mobileMenuList}>
          <li className={styles.mobileMenuItem} onClick={() => setDrawerType('sell')}>
            <img alt="판매내역" loading="lazy" width="52" height="52" decoding="async" className={styles.mobileMenuImage} src="https://img2.joongna.com/mystore/mypage/ios/20230411_Sale.png" />
            <div className={styles.mobileMenuText}>판매내역</div>
          </li>
          <li className={styles.mobileMenuItem} onClick={() => setDrawerType('buy')}>
            <img alt="구매내역" loading="lazy" width="52" height="52" decoding="async" className={styles.mobileMenuImage} src="https://img2.joongna.com/mystore/mypage/ios/20230411_Buy.png" />
            <div className={styles.mobileMenuText}>구매내역</div>
          </li>
          <li className={styles.mobileMenuItem} onClick={() => setDrawerType('delivery-request')}>
            <img alt="택배 신청" loading="lazy" width="52" height="52" decoding="async" className={styles.mobileMenuImage} src="https://img2.joongna.com/mystore/mypage/ios/20230411_Delivery.png" />
            <div className={styles.mobileMenuText}>택배 신청</div>
          </li>
          <li className={styles.mobileMenuItem} onClick={() => setDrawerType('favorites')}>
            <img alt="찜한 상품" loading="lazy" width="52" height="52" decoding="async" className={styles.mobileMenuImage} src="https://img2.joongna.com/mystore/mypage/ios/20230411_Heart.png" />
            <div className={styles.mobileMenuText}>찜한 상품</div>
          </li>
        </ul>
      </div>
      <div className={styles.mobileMenuDivider}></div>
    </>
  );
};

export default MyPageMenuMobile;