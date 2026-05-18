import { webapi } from "../../../shared/api/apiClient";

export const productApi = {
  createProductDetail: async (formData: FormData): Promise<number> => {
    const accessToken = localStorage.getItem("accessToken");

    return webapi("/product/detail/create", {
      method: "POST",
      body: formData,
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    });
  },

  updateProductDetail: async (formData: FormData): Promise<void> => {
    const accessToken = localStorage.getItem("accessToken");

    await webapi("/product/detail/update", {
      method: "PUT",
      body: formData,
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    });
  },

  deleteProductDetail: async (productId: number, userId: number): Promise<void> => {
    const accessToken = localStorage.getItem("accessToken");

    await webapi("/product/detail/delete", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
      },
      body: JSON.stringify({
        PRODUCT_ID: productId,
        USER_ID: userId,
      }),
    });
  },

  getProductDetail: async (productId: number) => {
    const savedUserId = localStorage.getItem("userId");
    const userId = savedUserId ? Number(savedUserId) : 0;

    const safeUserId = Number.isNaN(userId) ? 0 : userId;

    const res = await webapi(
      `/product/detail/select?PRODUCT_ID=${productId}&USER_ID=${safeUserId}`,
      {
        method: "GET",
      },
    );

    return Array.isArray(res) ? res[0] : res;
  },

  saveWishlist: async (productId: number) => {
    const accessToken = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("찜하기 실패: userId가 없습니다.");
      throw new Error("로그인이 필요한 기능입니다.");
    }

    return webapi("/user/wishlist/save", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
      },
      body: JSON.stringify({
        PRODUCT_ID: productId,
        USER_ID: Number(userId),
      }),
    });
  },
};