import React from 'react';
import styles from '../pages/MyPage.module.css';

const ProfileSection: React.FC = () => {
  return (
    <div className={styles.profileSection}>
      <div className={styles.profileHeader}>
        <div className={styles.profileImageContainer}>
          <img
            alt="profile-image"
            loading="lazy"
            width="60"
            height="60"
            decoding="async"
            className={styles.profileImage}
            src="https://img2.joongna.com/common/Profile/Default/profile_m.png"
          />
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.profileName}>
            <h2 className={styles.profileNameTitle}>도는하얀도화지</h2>
            <button type="button" aria-label="공유하기" className={styles.shareButton}>
              <svg width="20" height="20" viewBox="2 2 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19.5556 12.9408V18.9852C19.5556 19.5196 19.33 20.0321 18.9285 20.4099C18.5271 20.7878 17.9826 21 17.4148 21H5.64074C5.07298 21 4.52848 20.7878 4.12701 20.4099C3.72554 20.0321 3.5 19.5196 3.5 18.9852V7.90373C3.5 7.36937 3.72554 6.85689 4.12701 6.47904C4.52848 6.10119 5.07298 5.88892 5.64074 5.88892H12.063"
                  stroke="#9CA3AF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M14.8334 4H20C20.2762 4 20.5 4.22386 20.5 4.5V9.66667" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11.0554 13.4444L20.0276 4.47217" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className={styles.trustScore}>
        <div className={styles.trustScoreContainer}>
          <div className={styles.trustScoreHeader}>
            <span>
              <span className={styles.trustScoreLabel}>신뢰지수</span>
              <span className={styles.trustScoreValue}>162</span>
            </span>
            <span className={styles.trustScoreMax}>1,000</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
