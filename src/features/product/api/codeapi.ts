import { webapi } from "../../../shared/api/apiClient";

export type MainCategoryItem = {
  ID: number;
  MAIN_CATEGORY: string;
};

export type SubCategoryItem = {
  ID: number;
  MAIN_ID: number;
  SUB_CATEGORY: string;
};

export type StateItem = {
  ID: number;
  CODE: string;
  STATE: string;
};

export type CityItem = {
  ID: number;
  STATE_ID: number;
  CODE: string;
  CITY: string;
};

export async function findMainCategories(): Promise<MainCategoryItem[]> {
  const data = await webapi("/code/main/category", {
    method: "GET",
  });

  return data as MainCategoryItem[];
}

export async function findSubCategories(): Promise<SubCategoryItem[]> {
  const data = await webapi("/code/sub/category", {
    method: "GET",
  });

  return data as SubCategoryItem[];
}

export async function findStates(): Promise<StateItem[]> {
  const data = await webapi("/code/state", {
    method: "GET",
  });

  return data as StateItem[];
}

export async function findCities(): Promise<CityItem[]> {
  const data = await webapi("/code/city", {
    method: "GET",
  });

  return data as CityItem[];
}
