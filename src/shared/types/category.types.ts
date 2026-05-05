export type MainCategory = {
  m_category_id: number;
  m_category_name: string;
};

export type SubCategory = {
  s_category_id: number;
  parent_id: number;
  s_category_name: string;
};