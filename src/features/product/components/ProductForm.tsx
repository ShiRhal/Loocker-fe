import { useRef, useState } from "react";
import styles from "./ProductForm.module.css";
import ProductInfoSection from "./ProductInfoSection";
import ProductTradeSection from "./ProductTradeSection";
import useProductForm from "../hooks/useProductForm";
import { productApi } from "../api/productApi";

function getStoredNickname() {
  const directNickname = localStorage.getItem("nickname");
  if (directNickname && directNickname.trim()) {
    return directNickname;
  }

  const meRaw = localStorage.getItem("me");
  if (meRaw) {
    try {
      const parsed = JSON.parse(meRaw) as { nickname?: string };
      if (parsed.nickname && parsed.nickname.trim()) {
        return parsed.nickname;
      }
    } catch (error) {
      console.error("me 파싱 실패", error);
    }
  }

  return "";
}

export default function ProductForm() {
  const {
    form,
    errors,
    images,
    toastMessage,
    addImages,
    removeImage,
    setTitle,
    setSubCategory,
    setBasePrice,
    setDescription,
    setAccessoryStatus,
    setTradeType,
    validateBeforeSubmit,
  } = useProductForm();

  const [submitting, setSubmitting] = useState(false);

  const titleSectionRef = useRef<HTMLDivElement | null>(null);
  const priceSectionRef = useRef<HTMLDivElement | null>(null);
  const descriptionSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToSection = (target: HTMLDivElement | null) => {
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleSubmitClick = async () => {
    const result = validateBeforeSubmit();

    if (!result.isValid) {
      if (result.focusField === "TITLE") {
        scrollToSection(titleSectionRef.current);
      }

      if (result.focusField === "BASE_PRICE") {
        scrollToSection(priceSectionRef.current);
      }

      if (result.focusField === "DESCRIPTION") {
        scrollToSection(descriptionSectionRef.current);
      }

      return;
    }

    const nickname = getStoredNickname();

    const tradeTypeOrder = ["DIRECT", "LOCKER", "DELIVERY"];
    const sortedTradeType = tradeTypeOrder.filter((type) =>
      form.TRADE_TYPE.includes(type),
    );

    const formData = new FormData();

    formData.append("TITLE", form.TITLE);
    formData.append("DESCRIPTION", form.DESCRIPTION);
    formData.append("BASE_PRICE", String(form.BASE_PRICE));
    formData.append("ACCESSORY_STATUS", form.ACCESSORY_STATUS);
    formData.append("CITY", form.CITY ?? "");
    formData.append("SUB_CATEGORY", form.SUB_CATEGORY);
    formData.append("NICKNAME", nickname);
    formData.append("TRADE_TYPE", sortedTradeType.join("|"));
    formData.append("NEW_ID", "0");

    form.FILES.forEach((file) => {
      formData.append("files", file);
    });

    console.log("FormData 전송 전 확인");
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      setSubmitting(true);

      const createdProductId = await productApi.createProductDetail(formData);

      console.log("상품 등록 성공");
      console.log("createdProductId:", createdProductId);
    } catch (error) {
      console.error("상품 등록 실패", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <form className={styles.form}>
          <div className={styles.formInner}>
            <ProductInfoSection
              images={images}
              toastMessage={toastMessage}
              title={form.TITLE}
              subCategory={form.SUB_CATEGORY}
              basePrice={form.BASE_PRICE}
              description={form.DESCRIPTION}
              accessoryStatus={form.ACCESSORY_STATUS}
              errors={errors}
              titleSectionRef={titleSectionRef}
              priceSectionRef={priceSectionRef}
              descriptionSectionRef={descriptionSectionRef}
              onAddImages={addImages}
              onRemoveImage={removeImage}
              onTitleChange={setTitle}
              onSubCategoryChange={setSubCategory}
              onBasePriceChange={setBasePrice}
              onDescriptionChange={setDescription}
              onAccessoryStatusChange={setAccessoryStatus}
            />

            <ProductTradeSection
              tradeType={form.TRADE_TYPE}
              city={form.CITY}
              onTradeTypeChange={setTradeType}
            />
          </div>
        </form>
      </div>

      <div className={styles.submitBar}>
        <div className={styles.submitNotice}>
          판매 정보가 실제 상품과 다를 경우, 책임은 판매자에게 있음을
          동의합니다.
        </div>

        <div className={styles.submitBarInner}>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmitClick}
            disabled={submitting}
          >
            {submitting ? "등록 중..." : "판매하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
