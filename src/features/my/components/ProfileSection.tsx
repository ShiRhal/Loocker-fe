import React from 'react';
import styles from '../pages/MyPage.module.css';

interface ProfileSectionProps {
  nickname: string;
  onOpenNicknameChange?: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ nickname, onOpenNicknameChange }) => {
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
            <div className={styles.profileNameRow}>
              <h2 className={styles.profileNameTitle}>{nickname || '사용자'}</h2>
            </div>
            {onOpenNicknameChange ? (
              <button
                type="button"
                className={styles.nicknameChangeButton}
                onClick={onOpenNicknameChange}
              >
                변경
              </button>
            ) : null}
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
