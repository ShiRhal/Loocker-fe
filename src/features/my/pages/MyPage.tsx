import React, { useState } from 'react';
import styles from './MyPage.module.css';
import MyPageMenuDesktop from '../components/MyPageMenuDesktop';
import MyPageDrawer from '../components/MyPageDrawer';
import ProfileSection from '../components/ProfileSection';
import ProductSection from '../components/ProductSection';

const Sidebar: { [key: string]: { [key: string]: string } } = {
  'trade-info': {
    'sell': '판매 내역',
    'buy': '구매 내역',
    'favorites': '찜한 상품',
    'trade-status': '거래 상태',
  },
  'my-info': {
    'account': '계좌 관리',
    'address': '배송지 관리',
    'reviews': '거래 후기',
    'withdraw': '탈퇴하기'
  }
};

const MyPage: React.FC = () => {
  const [drawerType, setDrawerType] = useState<string | null>(null);

  return (
    <div className={styles.container}>
      <MyPageMenuDesktop setDrawerType={setDrawerType} menuConfig={Sidebar} />

      {/* 메인 콘텐츠 */}
      <div className={styles.mainContent}>
        <div className={styles.contentBlock}>
          <div className={styles.gridContainer}>
            <ProfileSection />
          </div>

          <ProductSection />
        </div>
      </div>
      <MyPageDrawer type={drawerType} open={!!drawerType} onClose={() => setDrawerType(null)} menuConfig={Sidebar} />
    </div>
  );
};

export default MyPage;