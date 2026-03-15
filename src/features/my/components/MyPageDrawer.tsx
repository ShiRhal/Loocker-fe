import React from 'react';
import { Drawer } from 'antd';

interface MyPageDrawerProps {
  type: string | null;
  open: boolean;
  onClose: () => void;
}

const MyPageDrawer: React.FC<MyPageDrawerProps> = ({ type, open, onClose }) => {
  const getTitle = (type: string) => {
    switch (type) {
      case 'sell': return '판매 내역';
      case 'buy': return '구매 내역';
      case 'delivery-request': return '택배 신청';
      case 'delivery-history': return '택배 내역';
      case 'favorites': return '찜한 상품';
      case 'payment-settlement': return '안심결제 정산내역';
      case 'account': return '계좌 관리';
      case 'address': return '배송지 관리';
      case 'reviews': return '거래 후기';
      case 'withdraw': return '탈퇴하기';
      default: return '내역';
    }
  };

  const getSrc = (type: string) => {
    switch (type) {
      case 'sell': return 'https://webview.joongna.com/order-history/list/sell';
      case 'buy': return 'https://webview.joongna.com/order-history/list/buy';
      case 'delivery-request': return 'https://webview.joongna.com/delivery/request';
      case 'delivery-history': return 'https://webview.joongna.com/delivery/history';
      case 'favorites': return 'https://webview.joongna.com/favorites';
      case 'payment-settlement': return 'https://webview.joongna.com/payment/settlement';
      case 'account': return 'https://webview.joongna.com/account/manage';
      case 'address': return 'https://webview.joongna.com/address/manage';
      case 'reviews': return 'https://webview.joongna.com/reviews';
      case 'withdraw': return 'https://webview.joongna.com/withdraw';
      default: return '';
    }
  };

  return (
    <Drawer
      title={type ? getTitle(type) : ''}
      placement="right"
      onClose={onClose}
      open={open}
      width={600}
    >
      {type && (
        <iframe
          className="w-full h-full"
          src={getSrc(type)}
          allow="geolocation; clipboard-read; clipboard-write"
        />
      )}
    </Drawer>
  );
};

export default MyPageDrawer;