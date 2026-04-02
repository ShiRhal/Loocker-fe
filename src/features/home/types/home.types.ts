export type SortType = "recommended" | "latest" | "priceAsc" | "priceDesc";

export type SearchFilterValue = {
  keyword: string;
  minPrice: string;
  maxPrice: string;
  isLocker:boolean;
  excludeSold: boolean;
  sort: SortType;
  mainCategory: string;
  subCategory: string;
}

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