import { api } from "../../../app/config/api";

export interface UserInfoUser {
  USER_ID: number;
  NICKNAME: string;
}

export interface UserInfoProduct {
  PRODUCT_ID?: number;
  TITLE: string;
  IMAGE_URL: string;
  PRODUCT_STATUS_CODE: string;
  VIEW_COUNT: number;
  BASE_PRICE: number;
  CREATED_AT: string;
}

export interface UserInfoAccount {
  ACCOUNT_ID: number;
  BANK_NAME: string;
  ACCOUNT_NUMBER: string;
  IS_DEFAULT: boolean;
  IS_ACTIVE: boolean;
  CREATED_AT: string;
}

export interface UserInfoAddress {
  ADDRESS_ID: number;
  ADDRESS: string;
  IS_DEFAULT: boolean;
  IS_ACTIVE: boolean;
  CREATED_AT: string;
}

export interface UserInfoResponse {
  USER: UserInfoUser | null;
  PRODUCT: UserInfoProduct[];
  WISHLIST: UserInfoProduct[];
  ACCOUNT: UserInfoAccount[];
  ADDRESS: UserInfoAddress[];
  SALELIST: UserInfoSale[];
  BUYLIST: UserInfoBuy[];
  REVIEW: UserInfoReview[];
}

export interface UserInfoSale {
  PRODUCT_ID?: number;
  TITLE: string;
  IMAGE_URL: string;
  PRODUCT_STATUS_CODE: string;
  VIEW_COUNT: number;
  BASE_PRICE?: number;
  CREATED_AT?: string;
  BUYER_NICKNAME: string;
  COMPLETED_AT: string;
  // 백엔드 스펙에 따라 존재할 수 있는 값(목록/상세 이동에 필요할 가능성)
  TRADE_ID?: number;
}

export interface UserInfoBuy {
  PRODUCT_ID?: number;
  TITLE: string;
  IMAGE_URL: string;
  PRODUCT_STATUS_CODE: string;
  VIEW_COUNT: number;
  BASE_PRICE?: number;
  CREATED_AT?: string;
  SELLER_NICKNAME: string;
  COMPLETED_AT: string;
  // 백엔드 스펙에 따라 존재할 수 있는 값(목록/상세 이동에 필요할 가능성)
  TRADE_ID?: number;
}

export interface UserInfoReview {
  REVIEW_ID: number;
  TRADE_ID: number;
  PRODUCT_ID: number;
  WRITER_NICKNAME: string;
  TARGET_USER_NICKNAME: string;
  SCORE: number;
  CONTENT: string;
  CREATED_AT: string;
  REVIEW_TYPE: string;
}

export interface UserNicknameResponse {
  USER_ID: number;
  NICKNAME: string;
}

export interface UpdateNicknameBody {
  USER_ID: number;
  NICKNAME: string;
}

export interface DeleteUserBody {
  USER_ID: number;
}

export interface CreateAccountBody {
  USER_ID: number;
  BANK_NAME: string;
  ACCOUNT_NUMBER: string;
}

export interface UpdateAccountBody {
  USER_ID: number;
  ACCOUNT_ID: number;
  BANK_NAME: string;
  ACCOUNT_NUMBER: string;
  IS_DEFAULT: boolean;
}

export interface DeleteAccountBody {
  USER_ID: number;
  ACCOUNT_ID: number;
}

export interface SelectAccountQuery {
  USER_ID: number;
}

export interface CreateAddressBody {
  USER_ID: number;
  ADDRESS: string;
}

export interface UpdateAddressBody {
  USER_ID: number;
  ADDRESS_ID: number;
  ADDRESS: string;
  IS_DEFAULT: boolean;
}

export interface DeleteAddressBody {
  USER_ID: number;
  ADDRESS_ID: number;
}

export interface SelectAddressQuery {
  USER_ID: number;
}

export interface SaveWishlistBody {
  USER_ID: number;
  PRODUCT_ID: number;
}

export interface SelectWishlistQuery {
  USER_ID: number;
}

export const myPageApi = {
  selectUserInfo: async (USER_ID: number): Promise<UserInfoResponse> => {
    return api(`/user/info/select?USER_ID=${USER_ID}`, { method: "GET" });
  },

  selectUserNickname: async (USER_ID: number): Promise<UserNicknameResponse> => {
    return api(`/user/nickname/select?USER_ID=${USER_ID}`, { method: "GET" });
  },

  updateUserNickname: async (body: UpdateNicknameBody): Promise<unknown> => {
    return api("/user/nickname/update", { method: "PUT", json: body });
  },

  deleteUser: async (body: DeleteUserBody): Promise<unknown> => {
    return api("/user/delete", { method: "PUT", json: body });
  },

  createAccount: async (body: CreateAccountBody): Promise<unknown> => {
    return api("/user/account/create", { method: "PUT", json: body });
  },

  updateAccount: async (body: UpdateAccountBody): Promise<unknown> => {
    return api("/user/account/update", { method: "PUT", json: body });
  },

  deleteAccount: async (body: DeleteAccountBody): Promise<unknown> => {
    return api("/user/account/delete", { method: "PUT", json: body });
  },

  selectAccount: async (query: SelectAccountQuery): Promise<UserInfoAccount[]> => {
    return api(`/user/account/select?USER_ID=${query.USER_ID}`, { method: "GET" });
  },

  createAddress: async (body: CreateAddressBody): Promise<unknown> => {
    return api("/user/address/create", { method: "PUT", json: body });
  },

  updateAddress: async (body: UpdateAddressBody): Promise<unknown> => {
    return api("/user/address/update", { method: "PUT", json: body });
  },

  deleteAddress: async (body: DeleteAddressBody): Promise<unknown> => {
    return api("/user/address/delete", { method: "PUT", json: body });
  },

  selectAddress: async (query: SelectAddressQuery): Promise<UserInfoAddress[]> => {
    return api(`/user/address/select?USER_ID=${query.USER_ID}`, { method: "GET" });
  },

  saveWishlist: async (body: SaveWishlistBody): Promise<unknown> => {
    return api("/user/wishlist/save", { method: "PUT", json: body });
  },

  selectWishlist: async (query: SelectWishlistQuery): Promise<UserInfoProduct[]> => {
    return api(`/user/wishlist/select?USER_ID=${query.USER_ID}`, { method: "GET" });
  },
};
