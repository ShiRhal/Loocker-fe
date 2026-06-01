import React from 'react';
import styles from '../pages/MyPage.module.css';

interface MenuConfig {
  [section: string]: {
    [key: string]: string;
  };
}

interface MyPageMenuMobileProps {
  setDrawerType: (type: string) => void;
  menuConfig: MenuConfig;
}


const menuInitials: Record<string, string> = {
  sell: 'S',
  buy: 'B',
  favorites: 'W',
  'trade-status': 'T',
  account: 'A',
  address: 'D',
  reviews: 'R',
  withdraw: 'X',
};

const MyPageMenuMobile: React.FC<MyPageMenuMobileProps> = ({
  setDrawerType,
  menuConfig,
}) => {
  return (
    <>
      <div className={styles.mobileMenuDivider} />
      <nav className={styles.mobileMenu} aria-label="마이페이지 빠른 메뉴">
        {Object.entries(menuConfig).map(([sectionKey, items]) => (
          <section key={sectionKey} className={styles.mobileMenuSection}>
            <div className={styles.mobileMenuList}>
              {Object.entries(items).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={styles.mobileMenuItem}
                  onClick={() => setDrawerType(key)}
                >
                  <span className={styles.mobileMenuImage} aria-hidden="true">
                    {menuInitials[key] ?? label.slice(0, 1)}
                  </span>
                  <span className={styles.mobileMenuText}>{label}</span>
                </button>
              ))}
            </div>
            <div className={styles.mobileMenuSectionDivider} />            
          </section>
        ))}
      </nav>
    </>
  );
};

export default MyPageMenuMobile;