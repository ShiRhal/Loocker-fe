import { webapi } from "./apiClient";

export type StateCodeResponse = {
  ID: number;
  CODE: string;
  STATE: string;
};

export type CityCodeResponse = {
  ID: number;
  STATE_ID: number;
  CODE: string;
  CITY: string;
};

export type MainCategoryResponse = {
  ID: number;
  MAIN_CATEGORY: string;
};

export type SubCategoryResponse = {
  ID: number;
  MAIN_ID: number;
  SUB_CATEGORY: string;
};

export const codeApi = {
  getStates(): Promise<StateCodeResponse[]> {
    return webapi("/code/state", {
      method: "GET",
    });
  },

  getCities(): Promise<CityCodeResponse[]> {
    return webapi("/code/city", {
      method: "GET",
    });
  },

  getMainCategories(): Promise<MainCategoryResponse[]> {
    return webapi("/code/main/category", {
      method: "GET",
    });
  },

  getSubCategories(): Promise<SubCategoryResponse[]> {
    return webapi("/code/sub/category", {
      method: "GET",
    });
  },
};