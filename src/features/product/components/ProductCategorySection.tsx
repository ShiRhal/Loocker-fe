import { useEffect, useMemo, useState } from "react";
import styles from "./ProductCategorySection.module.css";
import {
  findMainCategories,
  findSubCategories,
  type MainCategoryItem,
  type SubCategoryItem,
} from "../api/codeapi";

type ProductCategorySectionProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ProductCategorySection({
  value,
  onChange,
}: ProductCategorySectionProps) {
  const [mainCategories, setMainCategories] = useState<MainCategoryItem[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [mainRes, subRes] = await Promise.all([
          findMainCategories(),
          findSubCategories(),
        ]);

        setMainCategories(mainRes);
        setSubCategories(subRes);
      } catch (error) {
        console.error("카테고리 조회 실패", error);
      }
    };

    fetchCategories();
  }, []);

  const selectedSubCategory = useMemo(() => {
    return subCategories.find((sub) => sub.SUB_CATEGORY === value) ?? null;
  }, [subCategories, value]);

  const selectedMainCategory = useMemo(() => {
    if (!selectedSubCategory) return null;

    return (
      mainCategories.find((main) => main.ID === selectedSubCategory.MAIN_ID) ??
      null
    );
  }, [mainCategories, selectedSubCategory]);

  const filteredSubCategories = useMemo(() => {
    if (!selectedMainCategory) return [];

    return subCategories.filter(
      (sub) => sub.MAIN_ID === selectedMainCategory.ID,
    );
  }, [selectedMainCategory, subCategories]);

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
              {mainCategories.map((category) => {
                const isSelected = selectedMainCategory?.ID === category.ID;

                return (
                  <li
                    key={category.ID}
                    className={`${styles.categoryItem} ${
                      isSelected ? styles.categoryItemSelected : ""
                    }`}
                    onClick={() => {
                      const firstSubCategory = subCategories.find(
                        (sub) => sub.MAIN_ID === category.ID,
                      );

                      onChange(firstSubCategory?.SUB_CATEGORY ?? "");
                    }}
                  >
                    {category.MAIN_CATEGORY}
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
                  const isSelected = selectedSubCategory?.ID === category.ID;

                  return (
                    <li
                      key={category.ID}
                      className={`${styles.categoryItem} ${
                        isSelected ? styles.categoryItemSelected : ""
                      }`}
                      onClick={() => onChange(category.SUB_CATEGORY)}
                    >
                      {category.SUB_CATEGORY}
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
