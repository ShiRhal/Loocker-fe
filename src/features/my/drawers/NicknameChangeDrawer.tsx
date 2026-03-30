import React, { useEffect, useState } from 'react';
import MyDrawerLayout from './components/MyDrawerLayout';
import { myPageApi } from '../api/userInfoApi';
import styles from './NicknameChangeDrawer.module.css';

export interface NicknameChangeDrawerProps {
  onClose: () => void;
  userId: number;
  initialNickname: string;
  setNickname: (nickname: string) => void;
}

const NicknameChangeDrawer: React.FC<NicknameChangeDrawerProps> = ({
  onClose,
  userId,
  initialNickname,
  setNickname
}) => {
  const [value, setValue] = useState(initialNickname);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValue(initialNickname);
    setError(null);
  }, [initialNickname]);

  const trimmed = value.trim();
  const initialTrimmed = initialNickname.trim();
  const canSubmit =
    trimmed.length > 0 && trimmed !== initialTrimmed && !submitting;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await myPageApi.updateUserNickname({ USER_ID: userId, NICKNAME: trimmed });
      const newNickname = await myPageApi.selectUserNickname(userId);
      if (newNickname.NICKNAME !== trimmed) {
        setError('닉네임 변경에 실패했습니다.');
        return;
      }
      localStorage.setItem("nickname", trimmed);
      setNickname(trimmed);
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : '닉네임 변경에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MyDrawerLayout
      title="닉네임 변경"
      onBack={onClose}
      mainClassName={styles.main}
      footer={
        <div className={styles.footerInner}>
          {error ? <p className={styles.errorText}>{error}</p> : null}
          <button
            type="button"
            className={`${styles.submitButton} ${canSubmit ? styles.submitButtonActive : styles.submitButtonDisabled}`}
            disabled={!canSubmit}
            onClick={() => void handleConfirm()}
          >
            확인
          </button>
        </div>
      }
    >
      <div className={styles.panel}>
        <input
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="닉네임"
          autoComplete="nickname"
          maxLength={64}
          aria-invalid={!!error}
        />
      </div>
    </MyDrawerLayout>
  );
};

export default NicknameChangeDrawer;
