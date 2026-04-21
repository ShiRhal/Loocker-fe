import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './WithdrawDrawer.module.css';
import DrawerLayout from '../../../shared/components/DrawerLayout/DrawerLayout';
import { myPageApi } from '../api/userInfoApi';

interface WithdrawDrawerProps {
  onClose: () => void;
  userId: number | null;
}

const reasonsList = [
  { id: 'SECURITY', label: '사용 빈도가 낮고 개인정보 및 보안 우려' },
  { id: 'MANNER', label: '비매너 사용자들로 인한 불편 (사기 등)' },
  { id: 'SERVICE', label: '서비스 기능 불편 (상품등록/거래 등)' },
  { id: 'EVENT', label: '이벤트 등의 목적으로 한시 사용' },
  { id: 'ETC', label: '기타' },
];

const WithdrawDrawer: React.FC<WithdrawDrawerProps> = ({ onClose, userId }) => {
  const navigate = useNavigate();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [etcContent, setEtcContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleReason = (id: string) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((reason) => reason !== id) : [...prev, id]
    );
  };

  const isFormValid = selectedReasons.length > 0 && userId !== null && !submitting;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    if (userId === null) return;
    setError(null);
    setSubmitting(true);
    try {
      await myPageApi.deleteUser({ USER_ID: userId });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('nickname');
      onClose();
      navigate('/signin', { replace: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : '회원 탈퇴에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DrawerLayout
      title="회원 탈퇴"
      onBack={onClose}
      mainClassName={styles.main}
      footer={
        <button
          type="button"
          className={`${styles.submitButton} ${isFormValid ? styles.submitButtonActive : styles.submitButtonDisabled}`}
          disabled={!isFormValid}
          onClick={() => void handleSubmit()}
        >
          회원 탈퇴
        </button>
      }
    >
        {error ? <p role="alert">{error}</p> : null}
        {/* 탈퇴 사유 섹션 */}
        <section className={styles.section}>
          <h2 className={styles.headline}>
            탈퇴사유를 알려주시면 <br />
            개선을 위해 노력하겠습니다.
          </h2>
          <p className={styles.subText}>다중 선택이 가능해요.</p>

          <ul className={styles.reasonList}>
            {reasonsList.map((reason) => {
              const isChecked = selectedReasons.includes(reason.id);
              return (
                <li key={reason.id} className={styles.reasonItem}>
                  <label htmlFor={reason.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      id={reason.id}
                      className={styles.checkboxInput}
                      checked={isChecked}
                      onChange={() => handleToggleReason(reason.id)}
                    />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.checkboxIcon}>
                      <path
                        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                        fill={isChecked ? '#111827' : '#C2C6CE'}
                        stroke={isChecked ? '#111827' : '#C2C6CE'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 9L10.5 14.5L8 12"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className={styles.reasonText}>{reason.label}</span>
                  </label>

                  {/* 기타 선택 시 나타나는 텍스트 영역 */}
                  {reason.id === 'ETC' && isChecked && (
                    <div className={styles.textareaContainer}>
                      <textarea
                        placeholder="상세 사유를 작성해 주세요.&#13;&#10;(예 : 타 서비스 이용)"
                        className={styles.textarea}
                        value={etcContent}
                        onChange={(e) => setEtcContent(e.target.value)}
                        maxLength={200}
                      />
                      <span className={styles.charCount}>{etcContent.length}/200</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* 유의 사항 섹션 */}
        <section className={styles.section}>
          <h3 className={styles.noticeTitle}>유의 사항을 확인해주세요!</h3>
          <ul className={styles.noticeList}>
            <li className={styles.noticeItem}>
              <span className={styles.noticeNumber}>01</span>
              <p className={styles.noticeText}>
                탈퇴 신청일로부터 30일 이내에 동일한 아이디와 휴대폰 번호로 가입 불가하며 재가입 시, 신규 가입 혜택은 적용되지 않습니다.
              </p>
            </li>
            <li className={styles.noticeItem}>
              <span className={styles.noticeNumber}>02</span>
              <p className={styles.noticeText}>
                회원 탈퇴 시 본인 계정에 등록된 게시물 또는 회원이 작성한 게시물 일체는 삭제됩니다. 다만, 다른 회원에 의해 스크랩되어 게시되거나 공용 게시판에 등록된 게시물은 삭제되지 않으니 삭제를 원하신다면 미리 삭제 후 탈퇴를 진행해주세요.
              </p>
            </li>
            <li className={styles.noticeItem}>
              <span className={styles.noticeNumber}>03</span>
              <div>
                <p className={styles.noticeText}>
                  전자 상거래 등에서의 소비자 보호에 관한 법률 규정에 따라 아래와 같이 기록을 보관하며, 법률 의한 경우 외 다른 목적으로 이용되지 않습니다.
                </p>
                <ul className={styles.retentionList}>
                  <li className={styles.retentionItem}>
                    <p className={styles.retentionText}>표시 광고에 대한 기록</p>
                    <span className={styles.retentionPeriod}>6개월</span>
                  </li>
                  <li className={styles.retentionItem}>
                    <p className={styles.retentionText}>계약 또는 청약철회, 대금결제 및<br /> 재화 등의 공급에 관한 기록</p>
                    <span className={styles.retentionPeriod}>5년</span>
                  </li>
                  <li className={styles.retentionItem}>
                    <p className={styles.retentionText}>소비자의 불만 또는 분쟁처리에 관한 기록</p>
                    <span className={styles.retentionPeriod}>3년</span>
                  </li>
                  <li className={styles.retentionItem}>
                    <p className={styles.retentionText}>로그인 기록</p>
                    <span className={styles.retentionPeriod}>3개월</span>
                  </li>
                  <li className={styles.retentionItem}>
                    <p className={styles.retentionText}>전자금융거래기록</p>
                    <span className={styles.retentionPeriod}>5년</span>
                  </li>
                </ul>
              </div>
            </li>
            <li className={styles.noticeItem}>
              <span className={styles.noticeNumber}>04</span>
              <p className={styles.noticeText}>
                탈퇴 신청 후 72시간(3일) 이내 동일한 계정으로 로그인시 탈퇴 신청이 자동으로 철회됩니다.
              </p>
            </li>
          </ul>
        </section>
    </DrawerLayout>
  );
};

export default WithdrawDrawer;