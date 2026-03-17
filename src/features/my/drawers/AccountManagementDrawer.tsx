import React, { useEffect, useState } from 'react';
import styles from './AccountManagementDrawer.module.css';
import MyDrawerLayout from './components/MyDrawerLayout';

interface AccountManagementDrawerProps {
  onClose: () => void;
}

const banks = [
    '국민은행',
    '우리은행',
    '신한은행',
    '하나은행',
    '농협은행',
    '기업은행',
    'SC은행',
    '씨티은행',
    '경남은행',
    '대구은행',
    '부산은행',
    '광주은행',
    '전북은행',
  ];

interface AccountFormData {
  accountHolder: string;
  bank: string;
  accountNo: string;
  isMainAccount: boolean;
}

const AccountManagementDrawer: React.FC<AccountManagementDrawerProps> = ({ onClose }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isBankMenuOpen, setIsBankMenuOpen] = useState(false);
  const [formData, setFormData] = useState<AccountFormData>({
    accountHolder: '고호진', // 뒤로가기 시 복원을 위해 기본값 세팅
    bank: '',
    accountNo: '',
    isMainAccount: false,
  });

  useEffect(() => {
    if (!isRegistering) {
      setFormData({
        accountHolder: '고호진',
        bank: '',
        accountNo: '',
        isMainAccount: false,
      });
      setIsBankMenuOpen(false);
    }
  }, [isRegistering]);

  const handleRegisterAccount = () => {
    setIsRegistering(true);
  };

  const handleBankChange = (bank: string) => {
    setFormData((prev) => ({ ...prev, bank }));
    setIsBankMenuOpen(false);
  };

  const handleAccountNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData((prev) => ({ ...prev, accountNo: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, isMainAccount: e.target.checked }));
  };

  const isFormValid = formData.bank && formData.accountNo.length > 0;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      console.log('계좌 등록:', formData);
      setIsRegistering(false);
    }
  };

  const handleBack = () => {
    if (isRegistering) {
      setIsRegistering(false);
      return;
    }
    onClose();
  };

  if (isRegistering) { // 계좌 등록
    return (
      <MyDrawerLayout
        title="계좌 등록"
        onBack={handleBack}
        footer={
          <button
            type="submit"
            form="account_form"
            className={`${styles.submitButton} ${!isFormValid ? styles.submitButtonDisabled : ''}`}
            disabled={!isFormValid}
          >
            완료
          </button>
        }
      >
      <form id="account_form" className={styles.form} onSubmit={handleFormSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="accountHolder" className={styles.label}>
            예금주
          </label>
          <div className={styles.inputWrapper}>
            <input
              disabled
              id="accountHolder"
              type="text"
              value={formData.accountHolder}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>은행명</label>
          <div className={styles.selectWrapper}>
            <button
              type="button"
              className={styles.selectButton}
              onClick={() => setIsBankMenuOpen(!isBankMenuOpen)}
              role="combobox"
              aria-haspopup="listbox"
            >
              <span className={formData.bank ? styles.selectedBank : styles.placeholder}>
                {formData.bank || '은행명'}
              </span>
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M3.525 6.41a.616.616 0 0 1 .857.027L10 12.292l5.618-5.855a.616.616 0 0 1 .857-.027.583.583 0 0 1 .028.837l-6.06 6.316a.613.613 0 0 1-.885 0l-6.06-6.316a.583.583 0 0 1 .027-.837"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {isBankMenuOpen && (
              <div className={styles.bankMenu}>
                {banks.map((bank) => (
                  <button
                    key={bank}
                    type="button"
                  className={`${styles.bankOption} ${
                    formData.bank === bank ? styles.bankOptionSelected : ''
                  }`}
                  onClick={() => handleBankChange(bank)}
                >
                  {bank}
                </button>
              ))}
            </div>)}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="accountNo" className={styles.label}>
            계좌번호 (-없이 숫자만 입력)
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="accountNo"
              type="text"
              inputMode="numeric"
              placeholder="계좌번호"
              value={formData.accountNo}
              onChange={handleAccountNoChange}
              className={styles.input}
            />
          </div>
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.isMainAccount}
            onChange={handleCheckboxChange}
            className={styles.checkbox}
          />
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-4.47-2.47a.75.75 0 0 0-1.06-1.06l-4.97 4.97-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>대표계좌로 설정</span>
        </label>

        <div className={styles.notice}>
          <div>
            <span>안전한 중고거래를 위해</span>
            <span className={styles.noticeEmphasis}>회원 가입시 본인 인증한</span>
          </div>
          <span>명의의 계좌만 사용하실 수 있습니다.</span>
        </div>
      </form>
      </MyDrawerLayout>
    );
    }

  return ( // 계좌 목록
    <MyDrawerLayout title="계좌 관리" onBack={handleBack} mainClassName={styles.main}>
      <div role="main" aria-label="본문 영역" className={styles.emptyStateContainer}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.emptyIcon}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M22.1657 40.2874C22.0982 40.5494 22.0473 40.8186 22.014 41.0937L20.5458 53.2329C20.0987 56.9295 22.9843 60.1851 26.7078 60.1851H52.9049C55.9938 60.1851 58.6126 57.9138 59.0494 54.856L60.7836 42.7168C60.9037 41.8759 60.8501 41.0549 60.6518 40.2874H22.1657Z"
              fill="url(#paint0_linear_13883_15502)"
            />
            <path
              d="M32.168 60.6604C32.168 62.1366 31.0487 63.3333 29.668 63.3333C28.2873 63.3333 27.168 62.1366 27.168 60.6604C27.168 59.1841 29.668 55 29.668 55C29.668 55 32.168 59.1841 32.168 60.6604Z"
              fill="#73ACFF"
            />
            <circle cx="32.1667" cy="50.0002" r="1.66667" fill="white" />
            <circle cx="40.4987" cy="50.0002" r="1.66667" fill="white" />
            <circle cx="48.8346" cy="50.0002" r="1.66667" fill="white" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M22.1657 41.5645C22.0982 41.3024 22.0473 41.0332 22.014 40.7581L20.5458 28.6189C20.0987 24.9223 22.9843 21.6667 26.7078 21.6667H52.9049C55.9938 21.6667 58.6126 23.938 59.0494 26.9958L60.7836 39.135C60.9037 39.9759 60.8501 40.7969 60.6518 41.5645H22.1657Z"
              fill="#E7EBEE"
            />
            <rect x="25.6719" y="27.8735" width="13.9655" height="3.10345" rx="1.55172" fill="#CED6DA" />
            <rect x="25.6719" y="34.0806" width="23.2759" height="3.10345" rx="1.55172" fill="#CED6DA" />
            <defs>
              <linearGradient
                id="paint0_linear_13883_15502"
                x1="37.569"
                y1="40.2874"
                x2="40.6724"
                y2="67.4425"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#CBD4DA" />
                <stop offset="1" stopColor="#DDE5E9" />
              </linearGradient>
            </defs>
          </svg>

          <div className={styles.emptyStateText}>
            <h3 className={styles.emptyStateTitle}>등록된 계좌가 없습니다.</h3>
            <p className={styles.emptyStateDescription}>
              판매금 및 환불금을 빠르게 정산받으시려면 계좌를 등록해 주세요.
            </p>
          </div>

          <button className={styles.registerButton} onClick={handleRegisterAccount}>
            <svg width="12" height="12" fill="none" viewBox="0 0 16 16" aria-hidden="true">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M8.5 2.667a.5.5 0 0 0-1 0V7.5H2.667a.5.5 0 1 0 0 1H7.5v4.834a.5.5 0 0 0 1 0V8.5h4.833a.5.5 0 0 0 0-1H8.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>계좌 등록하기</span>
          </button>
      </div>
    </MyDrawerLayout>
  );
};

export default AccountManagementDrawer;
