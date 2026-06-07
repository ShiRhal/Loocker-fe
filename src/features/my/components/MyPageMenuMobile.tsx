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

type MenuIconProps = {
  type: string;
  label: string;
};

const iconStrokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function MenuIcon({ type, label }: MenuIconProps) {
  switch (type) {
    case 'sell':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path {...iconStrokeProps} d="M7 5.5h10a1.5 1.5 0 0 1 1.5 1.5v12l-2.4-1.4-2.4 1.4-2.4-1.4-2.4 1.4-2.4-1.4L5.5 19V7A1.5 1.5 0 0 1 7 5.5Z" />
          <path {...iconStrokeProps} d="M8.7 9.2h6.6M8.7 12.1h6.6M8.7 15h4" />
        </svg>
      );

    case 'buy':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path {...iconStrokeProps} d="M6.5 8.5h11l-.7 10.2A1.8 1.8 0 0 1 15 20.4H9a1.8 1.8 0 0 1-1.8-1.7L6.5 8.5Z" />
          <path {...iconStrokeProps} d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
          <path {...iconStrokeProps} d="m9.3 13 1.9 1.9 3.7-4" />
        </svg>
      );

    case 'favorites':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path {...iconStrokeProps} d="M12 20s-7.5-4.5-7.5-10.1A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 2.3C19.5 15.5 12 20 12 20Z" />
        </svg>
      );

    case 'trade-status':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path {...iconStrokeProps} d="M7.5 7.5h8.6l-2-2" />
          <path {...iconStrokeProps} d="m16.1 7.5-2 2" />
          <path {...iconStrokeProps} d="M16.5 16.5H7.9l2 2" />
          <path {...iconStrokeProps} d="m7.9 16.5 2-2" />
          <path {...iconStrokeProps} d="M12 10.3v3.4M10.3 12h3.4" />
        </svg>
      );

    case 'account':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path {...iconStrokeProps} d="M4.8 8.2h14.4a1.6 1.6 0 0 1 1.6 1.6v8a1.6 1.6 0 0 1-1.6 1.6H4.8a1.6 1.6 0 0 1-1.6-1.6v-8a1.6 1.6 0 0 1 1.6-1.6Z" />
          <path {...iconStrokeProps} d="M7 8.2V6.4A1.8 1.8 0 0 1 8.8 4.6h6.4A1.8 1.8 0 0 1 17 6.4v1.8M7.2 13.2h9.6M7.2 16.1h4.7" />
        </svg>
      );

    case 'address':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path {...iconStrokeProps} d="M12 21s6.2-5.3 6.2-10.4A6.2 6.2 0 0 0 5.8 10.6C5.8 15.7 12 21 12 21Z" />
          <circle cx="12" cy="10.6" r="2.2" {...iconStrokeProps} />
        </svg>
      );

    case 'reviews':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path {...iconStrokeProps} d="M5.3 6.5h13.4a1.8 1.8 0 0 1 1.8 1.8v7.2a1.8 1.8 0 0 1-1.8 1.8H12l-4.2 3v-3H5.3a1.8 1.8 0 0 1-1.8-1.8V8.3a1.8 1.8 0 0 1 1.8-1.8Z" />
          <path {...iconStrokeProps} d="m12 9.1.8 1.7 1.9.3-1.4 1.3.3 1.9-1.6-.9-1.6.9.3-1.9-1.4-1.3 1.9-.3.8-1.7Z" />
        </svg>
      );

    case 'withdraw':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path {...iconStrokeProps} d="M10.5 5.5H6.8A1.8 1.8 0 0 0 5 7.3v9.4a1.8 1.8 0 0 0 1.8 1.8h3.7" />
          <path {...iconStrokeProps} d="M13 8.5 16.5 12 13 15.5" />
          <path {...iconStrokeProps} d="M8.8 12h7.4" />
        </svg>
      );

    default:
      return (
        <span className={styles.mobileMenuFallbackText}>
          {label.slice(0, 1)}
        </span>
      );
  }
}

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
                    <MenuIcon type={key} label={label} />
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