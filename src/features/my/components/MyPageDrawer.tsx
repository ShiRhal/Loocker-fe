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
}

// type에 따라 다른 drawer를 렌더링하는 통합 컴포넌트입니다.
const MyPageDrawer: React.FC<MyPageDrawerProps> = ({ type, open, onClose, menuConfig }) => {
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
        width={600}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}            
      >
        <SellHistoryDrawer onClose={onClose} />
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
        width={600}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}            
      >
        <BuyHistoryDrawer onClose={onClose} />
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
        width={600}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}            
      >
        <FavoritesDrawer onClose={onClose} />
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
        width={600}
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
        width={600}
        styles={{
          body: { padding: 0 },
          header: { display: 'none' },
        }}
      >
        <AccountManagementDrawer onClose={onClose} />
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
        width={600}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}        
      >
        <AddressManagementDrawer onClose={onClose} />
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
        width={600}
        styles={{ 
          body: { padding: 0 }, 
          header: { display: 'none' } 
        }}            
      >
        <WithdrawDrawer onClose={onClose} />
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
        width={600}
        styles={{
          body: { padding: 0 },
          header: { display: 'none' },
        }}
      >
        <ReviewsDrawer onClose={onClose} />
      </Drawer>
    );
  }

  return (
    <Drawer
      title={type ? getTitle(type) : ''}
      placement="right"
      onClose={onClose}
      open={open}
      width={600}
    >
      {"대충 임시 텍스트"}
    </Drawer>
  );
};

export default MyPageDrawer;