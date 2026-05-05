export type StateCode = {
  s_id: number;
  s_code: string;
  state_name: string;
};

export type CityCode = {
  c_id: number;
  parent_id: number;
  c_code: string;
  city_name: string;
};