import React, { useEffect, useState } from 'react';
import styles from './AccountManagementDrawer.module.css';
import DrawerLayout from '../../../shared/components/DrawerLayout/DrawerLayout';
import { myPageApi, type UserInfoAccount } from '../api/userInfoApi';

interface AccountManagementDrawerProps {
  onClose: () => void;
  userId: number | null;
  accounts: UserInfoAccount[];
  onRefreshAccounts: () => Promise<void>;
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

const BANK_LOGO_MAP: Record<string, string> = {
  국민은행: 'https://img2.joongna.com/bank/kb.png',
  우리은행: 'https://img2.joongna.com/bank/woori.png',
  신한은행: 'https://img2.joongna.com/bank/shinhan.png',
  하나은행: 'https://img2.joongna.com/bank/hana.png',
  농협은행: 'https://img2.joongna.com/bank/nh.png',
  기업은행: 'https://img2.joongna.com/bank/ibk.png',
  SC은행: 'https://img2.joongna.com/bank/sc.png',
  씨티은행: 'https://img2.joongna.com/bank/citi.png',
  경남은행: 'https://img2.joongna.com/bank/kn.png',
  대구은행: 'https://img2.joongna.com/bank/dgb.png',
  부산은행: 'https://img2.joongna.com/bank/bnk.png',
  광주은행: 'https://img2.joongna.com/bank/kjbank.png',
  전북은행: 'https://img2.joongna.com/bank/jb.png',
};

interface AccountFormData {
  accountHolder: string;
  bank: string;
  accountNo: string;
  isMainAccount: boolean;
}

const normalizeCreateAccountError = (e: unknown) => {
  const fallback = '계좌 등록에 실패했습니다.';
  const message = e instanceof Error ? e.message : fallback;
  if (/이미 존재하는 계좌|error code \[50000\]|existing account/i.test(message)) {
    return '이미 등록된 계좌입니다.';
  }
  return message;
};

const AccountManagementDrawer: React.FC<AccountManagementDrawerProps> = ({
  onClose,
  userId,
  accounts,
  onRefreshAccounts,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBankMenuOpen, setIsBankMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    accountHolder: '',
    bank: '',
    accountNo: '',
    isMainAccount: false,
  });

  useEffect(() => {
    if (!isRegistering) {
      setFormData({
        accountHolder: '',
        bank: '',
        accountNo: '',
        isMainAccount: false,
      });
      setIsBankMenuOpen(false);
      setIsEditMode(false);
    }
  }, [isRegistering]);

  const handleRegisterAccount = () => {
    setError(null);
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

  const handleAccountHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, accountHolder: e.target.value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, isMainAccount: e.target.checked }));
  };

  const isFormValid = formData.bank && formData.accountNo.length > 0 && !submitting;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid && userId !== null) {
      setError(null);
      setSubmitting(true);
      try {
        await myPageApi.createAccount({
          USER_ID: userId,
          BANK_NAME: formData.bank,
          ACCOUNT_NUMBER: formData.accountNo,
        });
        await onRefreshAccounts();
        setIsRegistering(false);
      } catch (e) {
        const message = normalizeCreateAccountError(e);
        setError(message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSetDefault = async (account: UserInfoAccount) => {
    if (userId === null || submitting || account.IS_DEFAULT) return;
    setError(null);
    setSubmitting(true);
    try {
      await myPageApi.updateAccount({
        USER_ID: userId,
        ACCOUNT_ID: account.ACCOUNT_ID,
        BANK_NAME: account.BANK_NAME,
        ACCOUNT_NUMBER: account.ACCOUNT_NUMBER,
        IS_DEFAULT: true,
      });
      await onRefreshAccounts();
    } catch (e) {
      const message = e instanceof Error ? e.message : '대표계좌 설정에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (account: UserInfoAccount) => {
    if (userId === null || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await myPageApi.deleteAccount({
        USER_ID: userId,
        ACCOUNT_ID: account.ACCOUNT_ID,
      });
      await onRefreshAccounts();
    } catch (e) {
      const message = e instanceof Error ? e.message : '계좌 삭제에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isNoUser = userId === null;

  const handleBack = () => {
    if (isRegistering) {
      setIsRegistering(false);
      return;
    }
    onClose();
  };

  const getBankLogo = (bankName: string) => {
    return BANK_LOGO_MAP[bankName] || '';
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 8) return accountNumber;
    return `${accountNumber.slice(0, 4)}-${accountNumber.slice(4, 8)}-${accountNumber.slice(8)}`;
  };

  if (isRegistering) { // 계좌 등록
    return (
      <DrawerLayout
        title="계좌 등록"
        onBack={submitting ? () => undefined : handleBack}
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
              id="accountHolder"
              type="text"
              placeholder="예금주 입력"
              value={formData.accountHolder}
              onChange={handleAccountHolderChange}
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
          <span className={styles.checkboxIconWrapper}>
            <input
              type="checkbox"
              checked={formData.isMainAccount}
              onChange={handleCheckboxChange}
              className={styles.checkbox}
            />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.checkboxIcon}>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM16.5303 9.53033C16.8232 9.23744 16.8232 8.76256 16.5303 8.46967C16.2374 8.17678 15.7626 8.17678 15.4697 8.46967L10.5 13.4393L8.53033 11.4697C8.23744 11.1768 7.76256 11.1768 7.46967 11.4697C7.17678 11.7626 7.17678 12.2374 7.46967 12.5303L9.96967 15.0303C10.2626 15.3232 10.7374 15.3232 11.0303 15.0303L16.5303 9.53033Z"
                fill={formData.isMainAccount ? '#111827' : '#C2C6CE'}
              />
            </svg>
          </span>
          <span>대표계좌로 설정</span>
        </label>
        {error ? <p className={styles.errorText} role="alert">{error}</p> : null}

        <div className={styles.notice}>
          {/* <div>
            <span>안전한 중고거래를 위해</span>
            <span className={styles.noticeEmphasis}>회원 가입시 본인 인증한</span>
          </div>
          <span>명의의 계좌만 사용하실 수 있습니다.</span> */}
        </div>
      </form>
      </DrawerLayout>
    );
    }

  return (
    <DrawerLayout
      title="계좌 관리"
      onBack={handleBack}
      mainClassName={styles.main}
      headerAction={
        accounts.length > 0 ? (
          <button
            type="button"
            className={styles.headerEditButton}
            onClick={() => setIsEditMode((prev) => !prev)}
            disabled={submitting || isNoUser}
          >
            {isEditMode ? '완료' : '편집'}
          </button>
        ) : null
      }
    >
      <div role="main" aria-label="본문 영역" className={styles.listContainer}>
        {error ? <p className={styles.errorText} role="alert">{error}</p> : null}
        <div className={styles.cardList}>
          {accounts.map((account) => {
            const bankLogo = getBankLogo(account.BANK_NAME);
            return (
              <div key={account.ACCOUNT_ID} className={styles.accountCard} tabIndex={0}>
                <div className={styles.accountCardHeader}>
                  <div className={styles.bankInfo}>
                    {bankLogo ? (
                      <img src={bankLogo} alt={account.BANK_NAME} className={styles.bankLogo} />
                    ) : (
                      <span className={styles.bankLogoFallback} aria-hidden="true" />
                    )}
                    <span className={styles.bankName}>{account.BANK_NAME}</span>
                  </div>
                  {account.IS_DEFAULT ? <span className={styles.defaultBadge}>대표계좌</span> : null}
                </div>
                <div className={styles.accountDetailRows}>
                  <div className={styles.accountDetailRow}>
                    <span className={styles.detailLabel}>예금주</span>
                    <span className={styles.detailValue}>{formData.accountHolder || '-'}</span>
                  </div>
                  <div className={styles.accountDetailRow}>
                    <span className={styles.detailLabel}>계좌번호</span>
                    <span className={styles.detailValue}>{maskAccountNumber(account.ACCOUNT_NUMBER)}</span>
                  </div>
                </div>
                {isEditMode ? (
                  <div className={styles.cardActionRow}>
                    <button
                      type="button"
                      className={styles.cardActionButton}
                      onClick={() => void handleSetDefault(account)}
                      disabled={submitting || account.IS_DEFAULT || isNoUser}
                    >
                      대표로 설정
                    </button>
                    <button
                      type="button"
                      className={styles.cardActionButtonDanger}
                      onClick={() => void handleDeleteAccount(account)}
                      disabled={submitting || isNoUser}
                    >
                      삭제
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className={styles.addAccountButton}
          onClick={handleRegisterAccount}
          disabled={isNoUser || submitting}
        >
          <span className={styles.addButtonInner}>
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M8.5 2.667a.5.5 0 0 0-1 0V7.5H2.667a.5.5 0 1 0 0 1H7.5v4.834a.5.5 0 0 0 1 0V8.5h4.833a.5.5 0 0 0 0-1H8.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>계좌 추가</span>
          </span>
        </button>

        <div className={styles.noticeBox}>
          <div className={styles.noticeHeader}>
            <svg width="16" height="16" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <g>
                <path d="M24.5 0C11.2452 0 0.5 10.7452 0.5 24C0.5 37.2548 11.2452 48 24.5 48C37.7548 48 48.5 37.2548 48.5 24C48.5 10.7452 37.7548 0 24.5 0Z" fill="currentColor" />
                <path d="M24.6 30.1995C25.6488 30.1995 26.5 31.0507 26.5 32.0995C26.5 33.1483 25.6488 33.9995 24.6 33.9995C23.5512 33.9995 22.7 33.1483 22.7 32.0995C22.7 31.0507 23.5512 30.1995 24.6 30.1995Z" fill="white" />
                <path d="M24.5 13.7991L24.5 26.5991" stroke="white" strokeWidth="3" strokeMiterlimit="10" strokeLinecap="round" />
              </g>
            </svg>
            <span>정산계좌 안내</span>
          </div>
          <ul className={styles.noticeList}>
            <li>판매대금은 설정하신 대표계좌로 정산됩니다.</li>
            <li>대표계좌 변경 시, 진행 중 거래는 기존 계좌로 정산되니 참고해 주세요.</li>
          </ul>
        </div>
      </div>
    </DrawerLayout>
  );
};

export default AccountManagementDrawer;
