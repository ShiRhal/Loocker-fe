import type { RefObject } from "react";
import styles from "./ProductInfoSection.module.css";
import ProductCategorySection from "./ProductCategorySection";
import ProductAccessorySection from "./ProductAccessorySection";
import ProductImageUploader from "./ProductImageUploader";
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

function convertPriceToKorean(value: number | "") {
  if (value === "" || value <= 0) return "";

  const eok = Math.floor(value / 100000000);
  const man = Math.floor((value % 100000000) / 10000);
  const rest = value % 10000;

  const parts: string[] = [];

  if (eok > 0) {
    parts.push(`${eok}억원`);
  }

  if (man > 0) {
    parts.push(`${man}만원`);
  }

  if (rest > 0) {
    parts.push(`${rest.toLocaleString("ko-KR")}원`);
  }

  return parts.join(" ");
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
  const handlePriceChange = (value: string) => {
    const onlyNumber = value.replace(/[^0-9]/g, "");

    if (onlyNumber === "") {
      onBasePriceChange("");
      return;
    }

    onBasePriceChange(Number(onlyNumber));
  };

  const formattedPrice = formatPrice(basePrice);
  const koreanPriceText = convertPriceToKorean(basePrice);

  return (
    <section className={styles.block}>
      <div className={styles.blockHeader}>
        <h1 className={styles.blockTitle}>상품 정보</h1>
      </div>

      <div className={styles.mainDivider} />

      <section className={styles.sectionRow}>
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
      </section>

      <div className={styles.itemDivider} />

      <section className={styles.sectionRow} ref={titleSectionRef}>
        <div className={styles.sectionLabelBox}>
          <h2 className={styles.sectionLabel}>상품명</h2>
          <button type="button" className={styles.helperLink}>
            거래 제한 품목 안내
          </button>
        </div>

        <div className={styles.sectionContent}>
          <input
            className={`${styles.textInput} ${
              errors.TITLE ? styles.inputError : ""
            }`}
            type="text"
            placeholder="상품명을 입력해주세요"
            value={title}
            maxLength={64}
            onChange={(e) => onTitleChange(e.target.value)}
          />

          <div className={styles.textCount}>{title.length} / 64</div>

          {errors.TITLE && (
            <div className={styles.errorText}>
              상품명은 최소 2자 이상 입력해 주세요.
            </div>
          )}
        </div>
      </section>

      <div className={styles.itemDivider} />

      <ProductCategorySection
        value={subCategory}
        onChange={onSubCategoryChange}
      />

      <div className={styles.itemDivider} />

      <section className={styles.sectionRow} ref={priceSectionRef}>
        <div className={styles.sectionLabelBox}>
          <h2 className={styles.sectionLabel}>판매가격</h2>
        </div>

        <div className={styles.sectionContent}>
          <div className={styles.priceRow}>
            <div
              className={`${styles.priceInputBox} ${
                errors.BASE_PRICE ? styles.inputError : ""
              }`}
            >
              <span className={styles.pricePrefix}>₩</span>
              <input
                className={styles.priceInput}
                type="text"
                placeholder="판매가격"
                value={formattedPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
              />
            </div>
          </div>

          {!errors.BASE_PRICE && koreanPriceText && (
            <div className={styles.priceGuideText}>{koreanPriceText}</div>
          )}

          {errors.BASE_PRICE && (
            <div className={styles.errorText}>상품 가격을 입력해주세요.</div>
          )}
        </div>
      </section>

      <div className={styles.itemDivider} />

      <section className={styles.sectionRow} ref={descriptionSectionRef}>
        <div className={styles.sectionLabelBox}>
          <h2 className={styles.sectionLabel}>상품설명</h2>
        </div>

        <div className={styles.sectionContent}>
          <div
            className={`${styles.textareaBox} ${
              errors.DESCRIPTION ? styles.inputError : ""
            }`}
          >
            <textarea
              className={styles.textarea}
              placeholder={`- 상품명(브랜드)
- 구매 시기 (년, 월, 일)
- 사용 기간
- 하자 여부
* 실제 촬영한 사진과 함께 상세 정보를 입력해주세요.`}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              maxLength={5000}
            />
            <div
              className={`${styles.textCount} ${
                errors.DESCRIPTION ? styles.textCountError : ""
              }`}
            >
              {description.length} / 5000
            </div>
          </div>

          {errors.DESCRIPTION && (
            <div className={styles.errorText}>
              상품 설명은 10자 이상 입력해주세요.
            </div>
          )}
        </div>
      </section>

      <div className={styles.itemDivider} />

      <ProductAccessorySection
        value={accessoryStatus}
        onChange={onAccessoryStatusChange}
      />
    </section>
  );
}
