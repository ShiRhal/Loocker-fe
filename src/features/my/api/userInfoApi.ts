import { webapi } from "../../../shared/api/apiClient";

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

export type UserTradeRole = "BUYER" | "SELLER";

export type UserTradeTypeCode = "DIRECT" | "DELIVERY" | "LOCKER";

export interface UserInfoTrade {
  MY_ROLE: UserTradeRole;
  TITLE: string;
  BASE_PRICE: number;
  CREATED_AT: string;
  IMAGE_URL: string;
  TRADE_ID: number;
  VIEW_COUNT: number;
  STATUS_CODE: string;
  WISH_COUNT: number;
  CHAT_COUNT: number;
  TRADE_TYPE_CODE: UserTradeTypeCode;
  SELLER_NICKNAME: string;
  PRODUCT_ID: number;
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
  TRADE: UserInfoTrade[];
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

export interface DeleteProductBody {
  PRODUCT_ID: number;
}

export interface SelectWishlistQuery {
  USER_ID: number;
}

export const myPageApi = {
  selectUserInfo: async (USER_ID: number): Promise<UserInfoResponse> => {
    return webapi(`/user/info/select?USER_ID=${USER_ID}`, { method: "GET" });
  },

  selectUserNickname: async (
    USER_ID: number,
  ): Promise<UserNicknameResponse> => {
    return webapi(`/user/nickname/select?USER_ID=${USER_ID}`, {
      method: "GET",
    });
  },

  updateUserNickname: async (body: UpdateNicknameBody): Promise<unknown> => {
    return webapi("/user/nickname/update", { method: "PUT", json: body });
  },

  deleteUser: async (body: DeleteUserBody): Promise<unknown> => {
    return webapi("/user/delete", { method: "PUT", json: body });
  },

  createAccount: async (body: CreateAccountBody): Promise<unknown> => {
    return webapi("/user/account/create", { method: "PUT", json: body });
  },

  updateAccount: async (body: UpdateAccountBody): Promise<unknown> => {
    return webapi("/user/account/update", { method: "PUT", json: body });
  },

  deleteAccount: async (body: DeleteAccountBody): Promise<unknown> => {
    return webapi("/user/account/delete", { method: "PUT", json: body });
  },

  selectAccount: async (
    query: SelectAccountQuery,
  ): Promise<UserInfoAccount[]> => {
    return webapi(`/user/account/select?USER_ID=${query.USER_ID}`, {
      method: "GET",
    });
  },

  createAddress: async (body: CreateAddressBody): Promise<unknown> => {
    return webapi("/user/address/create", { method: "PUT", json: body });
  },

  updateAddress: async (body: UpdateAddressBody): Promise<unknown> => {
    return webapi("/user/address/update", { method: "PUT", json: body });
  },

  deleteAddress: async (body: DeleteAddressBody): Promise<unknown> => {
    return webapi("/user/address/delete", { method: "PUT", json: body });
  },

  selectAddress: async (
    query: SelectAddressQuery,
  ): Promise<UserInfoAddress[]> => {
    return webapi(`/user/address/select?USER_ID=${query.USER_ID}`, {
      method: "GET",
    });
  },

  saveWishlist: async (body: SaveWishlistBody): Promise<unknown> => {
    return webapi("/user/wishlist/save", { method: "PUT", json: body });
  },

  selectWishlist: async (
    query: SelectWishlistQuery,
  ): Promise<UserInfoProduct[]> => {
    return webapi(`/user/wishlist/select?USER_ID=${query.USER_ID}`, {
      method: "GET",
    });
  },

  deleteProductDetail: async (body: DeleteProductBody): Promise<unknown> => {
    return webapi("/product/detail/delete", { method: "PUT", json: body });
  },
};
