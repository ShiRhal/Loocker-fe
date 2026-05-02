import type { RefObject } from "react";
import styles from "./ProductInfoSection.module.css";
import ProductImageUploader from "./ProductImageUploader";
import ProductCategorySection from "./ProductCategorySection";
import ProductAccessorySection from "./ProductAccessorySection";
import type {
  ProductFormErrors,
  ProductImageItem,
} from "../hooks/useProductForm";

type ProductInfoSectionProps = {
  images: ProductImageItem[];
  toastMessage: string;
  title: string;
  subCategory: string;
  basePrice: number | "";
  description: string;
  accessoryStatus: string;
  errors: ProductFormErrors;
  titleSectionRef: RefObject<HTMLDivElement | null>;
  priceSectionRef: RefObject<HTMLDivElement | null>;
  descriptionSectionRef: RefObject<HTMLDivElement | null>;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  onTitleChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  onBasePriceChange: (value: number | "") => void;
  onDescriptionChange: (value: string) => void;
  onAccessoryStatusChange: (value: string) => void;
};

function formatPrice(value: number | "") {
  if (value === "") return "";
  return value.toLocaleString("ko-KR");
}

function formatPriceKorean(value: number | "") {
  if (value === "") return "";

  if (value >= 10000) {
    const man = Math.floor(value / 10000);
    const rest = value % 10000;

    if (rest === 0) return `${man.toLocaleString("ko-KR")}만원`;
    return `${man.toLocaleString("ko-KR")}만 ${rest.toLocaleString("ko-KR")}원`;
  }

  if (value >= 1000) {
    const cheon = Math.floor(value / 1000);
    const rest = value % 1000;

    if (rest === 0) return `${cheon}천원`;
    return `${cheon}천 ${rest.toLocaleString("ko-KR")}원`;
  }

  return `${value.toLocaleString("ko-KR")}원`;
}

export default function ProductInfoSection({
  images,
  toastMessage,
  title,
  subCategory,
  basePrice,
  description,
  accessoryStatus,
  errors,
  titleSectionRef,
  priceSectionRef,
  descriptionSectionRef,
  onAddImages,
  onRemoveImage,
  onTitleChange,
  onSubCategoryChange,
  onBasePriceChange,
  onDescriptionChange,
  onAccessoryStatusChange,
}: ProductInfoSectionProps) {
  return (
    <section className={styles.block}>
      <div className={styles.blockHeader}>
        <h1 className={styles.blockTitle}>상품 정보</h1>
      </div>

      <div className={styles.mainDivider} />

      <div className={styles.sectionRow}>
        <div className={styles.sectionLabelBox}>
          <h2 className={styles.sectionLabel}>상품 이미지</h2>
        </div>

        <div className={styles.sectionContent}>
          <ProductImageUploader
            images={images}
            toastMessage={toastMessage}
            onAddImages={onAddImages}
            onRemoveImage={onRemoveImage}
          />
        </div>
      </div>

      <div className={styles.itemDivider} />

      <div ref={titleSectionRef} className={styles.sectionRow}>
        <div className={styles.sectionLabelBox}>
          <h2 className={styles.sectionLabel}>제목</h2>
        </div>

        <div className={styles.sectionContent}>
          <input
            type="text"
            className={`${styles.textInput} ${
              errors.TITLE ? styles.inputError : ""
            }`}
            placeholder="상품명을 입력해 주세요."
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
          />

          {errors.TITLE && <p className={styles.errorText}>{errors.TITLE}</p>}
        </div>
      </div>

      <div className={styles.itemDivider} />

      <ProductCategorySection
        value={subCategory}
        onChange={onSubCategoryChange}
      />

      <div className={styles.itemDivider} />

      <div ref={priceSectionRef} className={styles.sectionRow}>
        <div className={styles.sectionLabelBox}>
          <h2 className={styles.sectionLabel}>가격</h2>
        </div>

        <div className={styles.sectionContent}>
          <div
            className={`${styles.priceInputBox} ${
              errors.BASE_PRICE ? styles.inputError : ""
            }`}
          >
            <span className={styles.pricePrefix}>₩</span>
            <input
              type="text"
              inputMode="numeric"
              className={styles.priceInput}
              placeholder="가격을 입력해 주세요."
              value={formatPrice(basePrice)}
              onChange={(event) => {
                const value = event.target.value.replace(/[^0-9]/g, "");
                onBasePriceChange(value === "" ? "" : Number(value));
              }}
            />
          </div>

          {basePrice !== "" && (
            <p className={styles.priceKoreanText}>
              {formatPriceKorean(basePrice)}
            </p>
          )}

          {errors.BASE_PRICE && (
            <p className={styles.errorText}>{errors.BASE_PRICE}</p>
          )}
        </div>
      </div>

      <div className={styles.itemDivider} />

      <div ref={descriptionSectionRef} className={styles.sectionRow}>
        <div className={styles.sectionLabelBox}>
          <h2 className={styles.sectionLabel}>설명</h2>
        </div>

        <div className={styles.sectionContent}>
          <div
            className={`${styles.textareaBox} ${
              errors.DESCRIPTION ? styles.inputError : ""
            }`}
          >
            <textarea
              className={styles.textarea}
              placeholder="상품 설명을 입력해 주세요."
              value={description}
              maxLength={2000}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />

            <div
              className={`${styles.textCount} ${
                errors.DESCRIPTION ? styles.textCountError : ""
              }`}
            >
              {description.length}/2000
            </div>
          </div>

          {errors.DESCRIPTION && (
            <p className={styles.errorText}>{errors.DESCRIPTION}</p>
          )}
        </div>
      </div>

      <div className={styles.itemDivider} />

      <ProductAccessorySection
        value={accessoryStatus}
        onChange={onAccessoryStatusChange}
      />
    </section>
  );
}
