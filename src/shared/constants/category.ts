import type {
  MainCategory,
  SubCategory,
} from "../types/category.types";

export const MAIN_CATEGORIES: MainCategory[] = [
  { m_category_id: 1, m_category_name: "패션의류" },
  { m_category_id: 2, m_category_name: "모바일/태블릿" },
  { m_category_id: 3, m_category_name: "스포츠" },
];

export const SUB_CATEGORIES: SubCategory[] = [
  { s_category_id: 1, parent_id: 1, s_category_name: "여성의류" },
  { s_category_id: 2, parent_id: 1, s_category_name: "남성의류" },
  { s_category_id: 3, parent_id: 1, s_category_name: "교복/체육복/단복" },
  { s_category_id: 4, parent_id: 1, s_category_name: "클로젯셰어" },

  { s_category_id: 5, parent_id: 2, s_category_name: "스마트폰" },
  { s_category_id: 6, parent_id: 2, s_category_name: "태블릿PC" },
  { s_category_id: 7, parent_id: 2, s_category_name: "스마트워치/밴드" },
  { s_category_id: 8, parent_id: 2, s_category_name: "일반/피쳐폰" },
  { s_category_id: 9, parent_id: 2, s_category_name: "케이스/거치대/보호필름" },
  { s_category_id: 10, parent_id: 2, s_category_name: "배터리/충전기/케이블" },
  { s_category_id: 11, parent_id: 2, s_category_name: "메모리/젠더/리더기" },

  { s_category_id: 12, parent_id: 3, s_category_name: "골프" },
  { s_category_id: 13, parent_id: 3, s_category_name: "자전거" },
  { s_category_id: 14, parent_id: 3, s_category_name: "인라인/스케이트/전동" },
  { s_category_id: 15, parent_id: 3, s_category_name: "축구" },
  { s_category_id: 16, parent_id: 3, s_category_name: "야구" },
  { s_category_id: 17, parent_id: 3, s_category_name: "농구" },
  { s_category_id: 18, parent_id: 3, s_category_name: "라켓스포츠" },
  { s_category_id: 19, parent_id: 3, s_category_name: "헬스/요가" },
  { s_category_id: 20, parent_id: 3, s_category_name: "수상스포츠" },
  { s_category_id: 21, parent_id: 3, s_category_name: "겨울스포츠" },
  { s_category_id: 22, parent_id: 3, s_category_name: "검도/격투/권투" },
  { s_category_id: 23, parent_id: 3, s_category_name: "기타스포츠" },
];