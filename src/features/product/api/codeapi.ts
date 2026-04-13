import { api } from "../../../app/config/api";

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
  const data = await api("/code/main/category", {
    method: "GET",
  });

  return data as MainCategoryItem[];
}

export async function findSubCategories(): Promise<SubCategoryItem[]> {
  const data = await api("/code/sub/category", {
    method: "GET",
  });

  return data as SubCategoryItem[];
}

export async function findStates(): Promise<StateItem[]> {
  const data = await api("/code/state", {
    method: "GET",
  });

  return data as StateItem[];
}

export async function findCities(): Promise<CityItem[]> {
  const data = await api("/code/city", {
    method: "GET",
  });

  return data as CityItem[];
}
