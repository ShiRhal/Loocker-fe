import { webapi } from "./apiClient";

export type PopularKeywordResponse = {
  KEYWORD: string;
};

export const searchApi = {
  getPopularKeywords(): Promise<PopularKeywordResponse[]> {
    return webapi("/search/select", {
      method: "GET",
    });
  },
};