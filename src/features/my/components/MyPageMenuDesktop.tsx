import React from 'react';
import styles from '../pages/MyPage.module.css';

interface MyPageMenuDesktopProps {
  setDrawerType: (type: string) => void;
}

const MyPageMenuDesktop: React.FC<MyPageMenuDesktopProps> = ({ setDrawerType }) => {
  return (
    <div className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>마이페이지</h2>
      <h3 className={styles.sidebarSectionTitle}>거래 정보</h3>
      <ul className={styles.sidebarList}>
        <li onClick={() => setDrawerType('sell')} className={styles.sidebarItem}>판매내역</li>
        <li onClick={() => setDrawerType('buy')} className={styles.sidebarItem}>구매내역</li>
        <li onClick={() => setDrawerType('delivery-request')} className={styles.sidebarItem}>택배 신청</li>
        <li onClick={() => setDrawerType('delivery-history')} className={styles.sidebarItem}>택배 내역</li>
        <li onClick={() => setDrawerType('favorites')} className={styles.sidebarItem}>찜한 상품</li>
        <li onClick={() => setDrawerType('payment-settlement')} className={styles.sidebarItem}>안심결제 정산내역</li>
      </ul>
      <h3 className={styles.sidebarSectionTitle}>내 정보</h3>
      <ul className={styles.sidebarList}>
        <li onClick={() => setDrawerType('account')} className={styles.sidebarItem}>계좌 관리</li>
        <li onClick={() => setDrawerType('address')} className={styles.sidebarItem}>배송지 관리</li>
        <li onClick={() => setDrawerType('reviews')} className={styles.sidebarItem}>거래 후기</li>
        <li onClick={() => setDrawerType('withdraw')} className={styles.sidebarItem}>탈퇴하기</li>
      </ul>
    </div>
  );
};

export default MyPageMenuDesktop;