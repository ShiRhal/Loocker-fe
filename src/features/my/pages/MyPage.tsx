import React, { useCallback, useEffect, useState } from 'react';
import styles from './MyPage.module.css';
import MyPageMenuDesktop from '../components/MyPageMenuDesktop';
import MyPageDrawer from '../components/MyPageDrawer';
import ProfileSection from '../components/ProfileSection';
import ProductSection from '../components/ProductSection';
import {
  myPageApi,
  type UserInfoAccount,
  type UserInfoAddress,
  type UserInfoProduct,
  type UserInfoSale,
  type UserInfoBuy,
  type UserInfoReview,
} from '../api/userInfoApi';

const Sidebar: { [key: string]: { [key: string]: string } } = {
  'trade-info': {
    'sell': '판매 내역',
    'buy': '구매 내역',
    'favorites': '찜한 상품',
    'trade-status': '거래 상태',
  },
  'my-info': {
    'account': '계좌 관리',
    'address': '배송지 관리',
    'reviews': '거래 후기',
    'withdraw': '탈퇴하기'
  }
};

function extractList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const value = (data as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

const MyPage: React.FC = () => {
  const [drawerType, setDrawerType] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [nickname, setNickname] = useState<string>('');
  const [products, setProducts] = useState<UserInfoProduct[]>([]);
  const [wishlist, setWishlist] = useState<UserInfoProduct[]>([]);
  const [accounts, setAccounts] = useState<UserInfoAccount[]>([]);
  const [addresses, setAddresses] = useState<UserInfoAddress[]>([]);
  const [sellList, setSellList] = useState<UserInfoSale[]>([]);
  const [buyList, setBuyList] = useState<UserInfoBuy[]>([]);
  const [reviewList, setReviewList] = useState<UserInfoReview[]>([]);

  const loadUserInfo = useCallback(async () => {
    const userIdValue = localStorage.getItem('userId');
    const uid = Number(userIdValue);

    if (!userIdValue || Number.isNaN(uid)) {
      setUserId(null);
      return;
    }

    setUserId(uid);

    try {
      const data = await myPageApi.selectUserInfo(uid);
      setNickname(data.USER?.NICKNAME || '');
      setProducts(data.PRODUCT || []);
      setWishlist(data.WISHLIST || []);
      setAccounts(data.ACCOUNT || []);
      setAddresses(data.ADDRESS || []);
      setSellList(data.SALELIST || []);
      setBuyList(data.BUYLIST || []);
      setReviewList(data.REVIEW || []);
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  }, []);

  useEffect(() => {
    void loadUserInfo();
  }, [loadUserInfo]);

  const refreshAccounts = useCallback(async () => {
    if (userId === null) return;
    try {
      const data = await myPageApi.selectAccount({ USER_ID: userId });
      setAccounts(extractList<UserInfoAccount>(data, 'ACCOUNT'));
    } catch (error) {
      console.error('계좌 정보 재조회 실패:', error);
    }
  }, [userId]);

  const refreshAddresses = useCallback(async () => {
    if (userId === null) return;
    try {
      const data = await myPageApi.selectAddress({ USER_ID: userId });
      setAddresses(extractList<UserInfoAddress>(data, 'ADDRESS'));
    } catch (error) {
      console.error('주소 정보 재조회 실패:', error);
    }
  }, [userId]);

  const refreshWishlist = useCallback(async () => {
    if (userId === null) return;
    try {
      const data = await myPageApi.selectWishlist({ USER_ID: userId });
      setWishlist(extractList<UserInfoProduct>(data, 'WISHLIST'));
    } catch (error) {
      console.error('찜 목록 재조회 실패:', error);
    }
  }, [userId]);

  return (
    <div className={styles.container}>
      <MyPageMenuDesktop setDrawerType={setDrawerType} menuConfig={Sidebar} />

      {/* 메인 콘텐츠 */}
      <div className={styles.mainContent}>
        <div className={styles.contentBlock}>
          <div className={styles.gridContainer}>
            <ProfileSection
              nickname={nickname}
              onOpenNicknameChange={
                userId !== null ? () => setDrawerType('nickname-change') : undefined
              }
            />
          </div>

          <ProductSection products={products} />
        </div>
      </div>
      <MyPageDrawer
        type={drawerType}
        open={!!drawerType}
        onClose={() => setDrawerType(null)}
        menuConfig={Sidebar}
        wishlist={wishlist}
        accounts={accounts}
        addresses={addresses}
        sellList={sellList}
        buyList={buyList}
        reviewList={reviewList}
        userId={userId}
        nickname={nickname}
        setNickname={setNickname}
        refreshAccounts={refreshAccounts}
        refreshAddresses={refreshAddresses}
        refreshWishlist={refreshWishlist}
      />
    </div>
  );
};

export default MyPage;