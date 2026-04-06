import React from 'react';
import { Drawer } from 'antd';
import SellHistoryDrawer from '../drawers/SellHistoryDrawer';
import BuyHistoryDrawer from '../drawers/BuyHistoryDrawer';
import FavoritesDrawer from '../drawers/FavoritesDrawer';
import TradeStatusDrawer from '../drawers/TradeStatusDrawer';
import AccountManagementDrawer from '../drawers/AccountManagementDrawer';
import AddressManagementDrawer from '../drawers/AddressManagementDrawer';
import WithdrawDrawer from '../drawers/WithdrawDrawer';
import ReviewsDrawer from '../drawers/ReviewsDrawer';
import NicknameChangeDrawer from '../drawers/NicknameChangeDrawer';
import type {
  UserInfoAccount,
  UserInfoAddress,
  UserInfoProduct,
  UserInfoBuy,
  UserInfoReview,
  UserInfoSale,
} from '../api/userInfoApi';

interface MenuConfig {
  [section: string]: {
    [key: string]: string;
  };
}

interface MyPageDrawerProps {
  type: string | null;
  open: boolean;
  onClose: () => void;
  menuConfig: MenuConfig;
  wishlist: UserInfoProduct[];
  accounts: UserInfoAccount[];
  addresses: UserInfoAddress[];
  sellList: UserInfoSale[];
  buyList: UserInfoBuy[];
  reviewList: UserInfoReview[];
  userId: number | null;
  nickname: string;
  setNickname: (nickname: string) => void;
  refreshAccounts: () => Promise<void>;
  refreshAddresses: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

// type에 따라 다른 drawer를 렌더링하는 통합 컴포넌트입니다.
const MyPageDrawer: React.FC<MyPageDrawerProps> = ({
  type,
  open,
  onClose,
  menuConfig,
  wishlist,
  accounts,
  addresses,
  sellList,
  buyList,
  reviewList,
  userId,
  nickname,
  setNickname,
  refreshAccounts,
  refreshAddresses,
  refreshWishlist,
}) => {
  const getTitle = (type: string) => {
    for (const section of Object.values(menuConfig)) {
      if (section[type]) {
        return section[type];
      }
    }
    return '내역';
  };

  if (type === 'sell') {
    return (
      <Drawer
        placement="right"
        onClose={onClose}
        closable={false}
        open={open}
        width={640}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}            
      >
        <SellHistoryDrawer onClose={onClose} sellList={sellList} />
      </Drawer>
    );
  }

  if (type === 'buy') {
    return (
      <Drawer
        placement="right"
        onClose={onClose}
        closable={false}
        open={open}
        width={640}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}            
      >
        <BuyHistoryDrawer onClose={onClose} buyList={buyList} />
      </Drawer>
    );
  }

  if (type === 'favorites') {
    return (
      <Drawer
        title={getTitle(type)}
        placement="right"
        onClose={onClose}
        closable={false}
        open={open}
        width={640}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}            
      >
        <FavoritesDrawer
          onClose={onClose}
          userId={userId}
          wishlist={wishlist}
          onRefreshWishlist={refreshWishlist}
        />
      </Drawer>
    );
  }
  if (type === 'trade-status') {
    return (
      <Drawer
        placement="right"
        onClose={onClose}
        closable={false}
        open={open}
        width={640}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}            
      >
        <TradeStatusDrawer onClose={onClose} />
      </Drawer>
    );
  }
  if (type === 'account') {
    return (
      <Drawer
        placement="right"
        onClose={onClose}
        closable={false}
        open={open}
        width={640}
        styles={{
          body: { padding: 0 },
          header: { display: 'none' },
        }}
      >
        <AccountManagementDrawer
          onClose={onClose}
          userId={userId}
          accounts={accounts}
          onRefreshAccounts={refreshAccounts}
        />
      </Drawer>
    );
  }

  if (type === 'address') {
    return (
      <Drawer
        placement="right"
        onClose={onClose}
        closable={false}
        open={open}
        width={640}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}        
      >
        <AddressManagementDrawer
          onClose={onClose}
          userId={userId}
          addresses={addresses}
          onRefreshAddresses={refreshAddresses}
        />
      </Drawer>
    );
  }

  if (type === 'withdraw') {
    return (
      <Drawer
        title={getTitle(type)}
        placement="right"
        onClose={onClose}
        closable={false}
        open={open}
        width={640}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}            
      >
        <WithdrawDrawer onClose={onClose} userId={userId} />
      </Drawer>
    );
  }

  if (type === 'reviews') {
    return (
      <Drawer
        placement="right"
        onClose={onClose}
        closable={false}
        open={open}
        width={640}
        styles={{
          body: { padding: 0 },
          header: { display: 'none' },
        }}
      >
        <ReviewsDrawer onClose={onClose} reviewList={reviewList} />
      </Drawer>
    );
  }

  if (type === 'nickname-change' && userId !== null) {
    return (
      <Drawer
        placement="right"
        onClose={onClose}
        closable={false}
        open={open}
        width={640}
        styles={{
          body: { padding: 0 },
          header: { display: 'none' },
        }}
      >
        <NicknameChangeDrawer
          onClose={onClose}
          userId={userId}
          initialNickname={nickname}
          setNickname={setNickname}
        />
      </Drawer>
    );
  }

  return (
    <Drawer
      title={type ? getTitle(type) : ''}
      placement="right"
      onClose={onClose}
      open={open}
      width={640}
    >
    </Drawer>
  );
};

export default MyPageDrawer;