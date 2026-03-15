import React, { useState } from 'react';
import styles from './MyPage.module.css';
import MyPageMenuDesktop from '../components/MyPageMenuDesktop';
import MyPageDrawer from '../components/MyPageDrawer';
import ProfileSection from '../components/ProfileSection';
import ProductSection from '../components/ProductSection';

const MyPage: React.FC = () => {
  const [drawerType, setDrawerType] = useState<string | null>(null);

  return (
    <div className={styles.container}>
      <MyPageMenuDesktop setDrawerType={setDrawerType} />

      {/* 메인 콘텐츠 */}
      <div className={styles.mainContent}>
        <div className={styles.contentBlock}>
          <div className={styles.gridContainer}>
            <ProfileSection />
          </div>

          <ProductSection />
        </div>
      </div>
      <MyPageDrawer type={drawerType} open={!!drawerType} onClose={() => setDrawerType(null)} />
    </div>
  );
};

export default MyPage;