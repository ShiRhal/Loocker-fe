/*
  홈 화면 상품 카드에 사용할 기본 타입 정의입니다.
*/

export type ProductItem = {
  id: number;
  title: string;
  price: number;
  location: string;
  createdText: string;
  likeCount: number;
  chatCount: number;
  isLockerTrade: boolean;
  imageUrl: string;
};