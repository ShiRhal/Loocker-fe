import React, { useState } from 'react';
import styles from './AddressManagementDrawer.module.css';
import DrawerLayout from '../../../shared/components/DrawerLayout/DrawerLayout';
import { myPageApi, type UserInfoAddress } from '../api/userInfoApi';

interface AddressManagementDrawerProps {
  onClose: () => void;
  userId: number | null;
  addresses: UserInfoAddress[];
  onRefreshAddresses: () => Promise<void>;
}

interface AddressFormData {
  title: string;
  name: string;
  phone: string;
  address: string;
  detailAddress: string;
  isMain: boolean;
}

const AddressManagementDrawer: React.FC<AddressManagementDrawerProps> = ({
  onClose,
  userId,
  addresses,
  onRefreshAddresses,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    title: '',
    name: '고호진', // 초기값 세팅
    phone: '01049481760', // 초기값 세팅
    address: '',
    detailAddress: '',
    isMain: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleToggleMain = () => {
    setFormData((prev) => ({ ...prev, isMain: !prev.isMain }));
  };

  const handleAddressSearch = () => {
    // TODO: 다음 우편번호 API 등의 주소 검색 로직 연동
    setFormData((prev) => ({ ...prev, address: '서울 강남구 테헤란로 123' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId === null || submitting) return;
    const mergedAddress = `${formData.address} ${formData.detailAddress}`.trim();
    if (!mergedAddress) return;
    setError(null);
    setSubmitting(true);
    try {
      await myPageApi.createAddress({
        USER_ID: userId,
        ADDRESS: mergedAddress,
      });
      await onRefreshAddresses();
      setIsAdding(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : '배송지 등록에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (address: UserInfoAddress) => {
    if (userId === null || submitting || address.IS_DEFAULT) return;
    setError(null);
    setSubmitting(true);
    try {
      await myPageApi.updateAddress({
        USER_ID: userId,
        ADDRESS_ID: address.ADDRESS_ID,
        ADDRESS: address.ADDRESS,
        IS_DEFAULT: true,
      });
      await onRefreshAddresses();
    } catch (e) {
      const message = e instanceof Error ? e.message : '기본 배송지 설정에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (address: UserInfoAddress) => {
    if (userId === null || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await myPageApi.deleteAddress({
        USER_ID: userId,
        ADDRESS_ID: address.ADDRESS_ID,
      });
      await onRefreshAddresses();
    } catch (e) {
      const message = e instanceof Error ? e.message : '배송지 삭제에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // 폼 유효성 검사 (필수값 입력 확인)
  const isFormValid =
    formData.title &&
    formData.name &&
    formData.phone &&
    formData.address &&
    formData.detailAddress &&
    !submitting;

  // 배송지 추가 폼 화면
  if (isAdding) {
    return (
      <DrawerLayout
        title="배송지 추가"
        onBack={submitting ? () => undefined : () => setIsAdding(false)}
        mainClassName={styles.main}
        footer={
          <button
            type="submit"
            form="address_form"
            className={`${styles.submitButton} ${!isFormValid ? styles.submitButtonDisabled : ''}`}
            disabled={!isFormValid}
          >
            완료
          </button>
        }
      >
          <form id="address_form" className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <input
                id="title"
                className={styles.input}
                type="text"
                placeholder="배송지명 (최대 10글자)"
                maxLength={10}
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <input
                id="name"
                className={styles.input}
                type="text"
                placeholder="이름 입력"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <input
                id="phone"
                className={styles.input}
                type="text"
                placeholder="휴대폰 번호 (- 없이 숫자만 입력)"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData((prev) => ({ ...prev, phone: value }));
                }}
              />
            </div>
            
            <button
              type="button"
              className={`${styles.searchAddressBtn} ${formData.address ? styles.searchAddressBtnActive : ''}`}
              onClick={handleAddressSearch}
            >
              {formData.address || '주소 검색'}
            </button>

            <div className={styles.inputGroup}>
              <input
                id="detailAddress"
                className={styles.input}
                type="text"
                placeholder="상세주소 (예시 : 101동 101호)"
                value={formData.detailAddress}
                onChange={handleInputChange}
              />
            </div>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={formData.isMain}
                onChange={handleToggleMain}
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.checkboxIcon}>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM16.5303 9.53033C16.8232 9.23744 16.8232 8.76256 16.5303 8.46967C16.2374 8.17678 15.7626 8.17678 15.4697 8.46967L10.5 13.4393L8.53033 11.4697C8.23744 11.1768 7.76256 11.1768 7.46967 11.4697C7.17678 11.7626 7.17678 12.2374 7.46967 12.5303L9.96967 15.0303C10.2626 15.3232 10.7374 15.3232 11.0303 15.0303L16.5303 9.53033Z"
                  fill={formData.isMain ? '#111827' : '#C2C6CE'}
                />
              </svg>
              <span className={styles.checkboxText}>대표 배송지로 설정</span>
            </label>
            {error ? <p role="alert">{error}</p> : null}
          </form>
      </DrawerLayout>
    );
  }

  // 초기 상태 (빈 배송지 목록) 화면
  return (
    <DrawerLayout
      title="배송지 관리"
      onBack={onClose}
      mainClassName={styles.main}
      headerAction={
        addresses.length > 0 ? (
          <button
            type="button"
            className={styles.headerEditButton}
            onClick={() => setIsEditMode((prev) => !prev)}
            disabled={submitting}
          >
            {isEditMode ? '완료' : '편집'}
          </button>
        ) : null
      }
    >
      {addresses.length > 0 ? (
        <div className={styles.listContainer}>
          {error ? <p role="alert">{error}</p> : null}
          {addresses.map((address) => (
            <div key={address.ADDRESS_ID} className={styles.addressCard}>
              <div className={styles.addressCardHeader}>
                <h3 className={styles.addressTitle}>배송지</h3>
                {address.IS_DEFAULT ? <span className={styles.defaultBadge}>기본배송지</span> : null}
              </div>
              <p className={styles.addressText}>{address.ADDRESS}</p>
              <p className={styles.addressMeta}>{address.CREATED_AT || '-'}</p>
              {isEditMode ? (
                <div className={styles.cardActionRow}>
                  <button
                    type="button"
                    className={styles.cardActionButton}
                    onClick={() => void handleSetDefault(address)}
                    disabled={submitting || userId === null || address.IS_DEFAULT}
                  >
                    기본 배송지 설정
                  </button>
                  <button
                    type="button"
                    className={styles.cardActionButtonDanger}
                    onClick={() => void handleDeleteAddress(address)}
                    disabled={submitting || userId === null}
                  >
                    삭제
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          <button className={styles.addAddressButton} onClick={() => setIsAdding(true)} disabled={userId === null}>
            배송지 추가
          </button>
        </div>
      ) : (
        <div className={styles.emptyState}>
          {error ? <p role="alert">{error}</p> : null}
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.emptyIcon}>
            <path d="M2.55228 47.2385C1.43253 47.5438 0.40507 46.5164 0.710455 45.3966L5.32307 28.4837L19.4652 42.6258L2.55228 47.2385Z" fill="#DDE1E4" />
            <path fillRule="evenodd" clipRule="evenodd" d="M4.95771e-06 24C7.69579e-06 10.7452 10.7452 -1.37836e-06 24 -8.87953e-07C37.2548 -3.9755e-07 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 2.21964e-06 37.2548 4.95771e-06 24ZM17 23.9998C17 22.3438 15.656 20.9998 14 20.9998C12.344 20.9998 11 22.3438 11 23.9998C11 25.6558 12.344 26.9998 14 26.9998C15.656 26.9998 17 25.6558 17 23.9998ZM24 20.9998C25.656 20.9998 27 22.3438 27 23.9998C27 25.6558 25.656 26.9998 24 26.9998C22.344 26.9998 21 25.6558 21 23.9998C21 22.3438 22.344 20.9998 24 20.9998ZM37 23.9998C37 22.3438 35.656 20.9998 34 20.9998C32.344 20.9998 31 22.3438 31 23.9998C31 25.6558 32.344 26.9998 34 26.9998C35.656 26.9998 37 25.6558 37 23.9998Z" fill="#DDE1E4" />
          </svg>
          <p className={styles.emptyText}>등록된 배송지 정보가 없습니다.</p>
          <p className={styles.emptySubText}>배송지는 최대 5개까지 등록할 수 있습니다.</p>
          <button className={styles.addButton} onClick={() => setIsAdding(true)} disabled={userId === null}>
            배송지 추가
          </button>
        </div>
      )}
    </DrawerLayout>
  );
};

export default AddressManagementDrawer;