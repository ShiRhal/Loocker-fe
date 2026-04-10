import { api } from "../../../app/config/api";

export const productApi = {
  createProductDetail: async (formData: FormData): Promise<number> => {
    const accessToken = localStorage.getItem("accessToken");

    return api("/product/detail/create", {
      method: "POST",
      body: formData,
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    });
  },
};
