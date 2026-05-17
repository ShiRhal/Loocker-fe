import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/auth/useAuth';
import styles from '../pages/MyPage.module.css';

interface MenuConfig {
  [section: string]: {
    [key: string]: string;
  };
}

interface MyPageMenuDesktopProps {
  setDrawerType: (type: string) => void;
  menuConfig: MenuConfig;
}

const MyPageMenuDesktop: React.FC<MyPageMenuDesktopProps> = ({ setDrawerType, menuConfig }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const sectionTitles: { [key: string]: string } = {
    'trade-info': '거래 정보',
    'my-info': '내 정보',
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>마이페이지</h2>
      <button type="button" className={styles.sidebarLogout} onClick={() => void handleLogout()}>
        로그아웃
      </button>
      {Object.entries(menuConfig).map(([sectionKey, items]) => (
        <div key={sectionKey}>
          <h3 className={styles.sidebarSectionTitle}>{sectionTitles[sectionKey]}</h3>
          <ul className={styles.sidebarList}>
            {Object.entries(items).map(([key, label]) => (
              <li
                key={key}
                onClick={() => setDrawerType(key)}
                className={styles.sidebarItem}
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default MyPageMenuDesktop;