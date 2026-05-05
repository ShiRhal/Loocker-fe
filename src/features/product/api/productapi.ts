import { webapi } from "../../../app/config/api";

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
};
