import type { StateCode, CityCode } from "../types/location.types";

export const STATE_CODES: StateCode[] = [
  { s_id: 1, s_code: "GG", state_name: "경기도" },
  { s_id: 2, s_code: "GW", state_name: "강원도" },
  { s_id: 3, s_code: "JLN", state_name: "전라북도" },
  { s_id: 4, s_code: "JLS", state_name: "전라남도" },
  { s_id: 5, s_code: "CCN", state_name: "충청북도" },
  { s_id: 6, s_code: "CCS", state_name: "충청남도" },
  { s_id: 7, s_code: "GSN", state_name: "경상북도" },
  { s_id: 8, s_code: "GSS", state_name: "경상남도" },
];

export const CITY_CODES: CityCode[] = [
  { c_id: 1, parent_id: 1, c_code: "SWC", city_name: "수원시" },
  { c_id: 2, parent_id: 1, c_code: "YIC", city_name: "용인시" },
  { c_id: 3, parent_id: 1, c_code: "AYC", city_name: "안양시" },
  { c_id: 4, parent_id: 1, c_code: "ASC", city_name: "안산시" },
  { c_id: 5, parent_id: 1, c_code: "UWC", city_name: "의왕시" },

  { c_id: 6, parent_id: 2, c_code: "CCC", city_name: "춘천시" },
  { c_id: 7, parent_id: 2, c_code: "GNC", city_name: "강릉시" },
  { c_id: 8, parent_id: 2, c_code: "SCC", city_name: "속초시" },
  { c_id: 9, parent_id: 2, c_code: "DHC", city_name: "동해시" },
  { c_id: 10, parent_id: 2, c_code: "WJC", city_name: "원주시" },
];