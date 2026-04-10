import styles from "./ProductCategorySection.module.css";
import {
  MAIN_CATEGORIES,
  SUB_CATEGORIES,
} from "../../../shared/constants/category";
import type {
  MainCategory,
  SubCategory,
} from "../../../shared/types/category.types";

type ProductCategorySectionProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ProductCategorySection({
  value,
  onChange,
}: ProductCategorySectionProps) {
  const selectedSubCategory: SubCategory | null =
    SUB_CATEGORIES.find((sub) => sub.s_category_name === value) ?? null;

  const selectedMainCategory: MainCategory | null = selectedSubCategory
    ? (MAIN_CATEGORIES.find(
        (main) => main.m_category_id === selectedSubCategory.parent_id,
      ) ?? null)
    : null;

  const filteredSubCategories = selectedMainCategory
    ? SUB_CATEGORIES.filter(
        (sub) => sub.parent_id === selectedMainCategory.m_category_id,
      )
    : [];

  return (
    <section className={styles.sectionRow}>
      <div className={styles.sectionLabelBox}>
        <h2 className={styles.sectionLabel}>카테고리</h2>
      </div>

      <div className={styles.sectionContent}>
        <div
          className={`${styles.categoryRow} ${
            selectedMainCategory ? styles.categoryRowWithSubCategory : ""
          }`}
        >
          <div className={styles.categoryPanel}>
            <ul className={styles.categoryList}>
              {MAIN_CATEGORIES.map((category) => {
                const isSelected =
                  selectedMainCategory?.m_category_id ===
                  category.m_category_id;

                return (
                  <li
                    key={category.m_category_id}
                    className={`${styles.categoryItem} ${
                      isSelected ? styles.categoryItemSelected : ""
                    }`}
                    onClick={() => {
                      const firstSubCategory = SUB_CATEGORIES.find(
                        (sub) => sub.parent_id === category.m_category_id,
                      );

                      onChange(firstSubCategory?.s_category_name ?? "");
                    }}
                  >
                    {category.m_category_name}
                  </li>
                );
              })}
            </ul>
          </div>

          <div
            className={`${styles.categoryPanel} ${
              !selectedMainCategory ? styles.categoryPanelHidden : ""
            }`}
          >
            {selectedMainCategory && (
              <ul className={styles.categoryList}>
                {filteredSubCategories.map((category) => {
                  const isSelected =
                    selectedSubCategory?.s_category_id ===
                    category.s_category_id;

                  return (
                    <li
                      key={category.s_category_id}
                      className={`${styles.categoryItem} ${
                        isSelected ? styles.categoryItemSelected : ""
                      }`}
                      onClick={() => onChange(category.s_category_name)}
                    >
                      {category.s_category_name}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.categoryNotice}>
          부피가 큰 상품은 보관함 거래가 불가능합니다.
        </div>
      </div>
    </section>
  );
}
