import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./ProductForm.module.css";
import ProductInfoSection from "./ProductInfoSection";
import ProductTradeSection from "./ProductTradeSection";
import useProductForm, { type ProductImageItem } from "../hooks/useProductForm";
import { productApi } from "../api/productapi";
import type { ProductDetail } from "../types/product.types";

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

function getStoredUserId(): number | null {
  const raw = localStorage.getItem("userId");
  if (!raw) return null;

  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function buildImageFilesForSubmit(
  items: ProductImageItem[],
): Promise<File[]> {
  const result: File[] = [];
  let index = 0;

  for (const item of items) {
    if (item.file) {
      result.push(item.file);
      index++;
      continue;
    }

    if (item.sourceUrl) {
      const res = await fetch(item.sourceUrl, { credentials: "include" });
      if (!res.ok) {
        throw new Error("기존 이미지를 불러오지 못했습니다.");
      }

      const blob = await res.blob();
      const mime = blob.type || "image/jpeg";
      const ext = mime.includes("png")
        ? "png"
        : mime.includes("webp")
          ? "webp"
          : "jpg";

      result.push(
        new File([blob], `image-${index}.${ext}`, {
          type: mime || "image/jpeg",
        }),
      );
    }

    index++;
  }

  return result;
}

export default function ProductForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);

  const {
    form,
    errors,
    images,
    toastMessage,
    showToast,
    addImages,
    removeImage,
    setTitle,
    setSubCategory,
    setBasePrice,
    setDescription,
    setAccessoryStatus,
    setTradeType,
    setCity,
    validateBeforeSubmit,
    hydrateFromProductDetail,
    resetForm,
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

  useEffect(() => {
    const type = searchParams.get("type");
    const rawId = searchParams.get("productId");

    if (type !== "edit" || !rawId) {
      setEditProductId(null);
      setDetailLoadError(null);
      resetForm();
      return;
    }

    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      setEditProductId(null);
      setDetailLoadError(null);
      resetForm();
      return;
    }

    setEditProductId(id);
    let cancelled = false;

    (async () => {
      setDetailLoading(true);
      setDetailLoadError(null);

      try {
        const detail = (await productApi.getProductDetail(id)) as
          | ProductDetail
          | null
          | undefined;

        if (cancelled) return;

        if (!detail || typeof detail !== "object" || !detail.PRODUCT_ID) {
          throw new Error("NOT_FOUND");
        }

        hydrateFromProductDetail(detail);
      } catch {
        if (!cancelled) {
          const message = "상품 정보를 불러오지 못했습니다.";
          setDetailLoadError(message);
          showToast(message);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, hydrateFromProductDetail, showToast, resetForm]);

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

    if (images.length === 0) {
      showToast("상품 이미지를 1장 이상 등록해 주세요.");
      return;
    }

    if (form.TRADE_TYPE.includes("DIRECT") && !form.CITY) {
      showToast("위치 설정을 해주세요.");
      return;
    }

    const nickname = getStoredNickname();

    const tradeTypeOrder = ["DIRECT", "LOCKER", "DELIVERY"];
    const sortedTradeType = tradeTypeOrder.filter((type) =>
      form.TRADE_TYPE.includes(type),
    );

    const isEdit = editProductId !== null;
    const userId = getStoredUserId();

    if (isEdit && userId === null) {
      showToast("로그인이 필요합니다.");
      return;
    }

    try {
      setSubmitting(true);

      const imageFiles = await buildImageFilesForSubmit(images);

      if (imageFiles.length === 0) {
        showToast("상품 이미지를 1장 이상 등록해 주세요.");
        return;
      }

      if (isEdit) {
        const formData = new FormData();

        formData.append("PRODUCT_ID", String(editProductId));
        formData.append("USER_ID", String(userId));
        formData.append("TITLE", form.TITLE);
        formData.append("DESCRIPTION", form.DESCRIPTION);
        formData.append("BASE_PRICE", String(form.BASE_PRICE));
        formData.append("ACCESSORY_STATUS", form.ACCESSORY_STATUS);
        formData.append("CITY", form.CITY ?? "");
        formData.append("SUB_CATEGORY", form.SUB_CATEGORY);
        formData.append("TRADE_TYPE", sortedTradeType.join("|"));

        imageFiles.forEach((file) => {
          formData.append("files", file);
        });

        await productApi.updateProductDetail(formData);

        showToast("수정되었습니다.");

        window.setTimeout(() => {
          navigate(`/product/${editProductId}`);
        }, 700);

        return;
      }

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

      imageFiles.forEach((file) => {
        formData.append("files", file);
      });

      await productApi.createProductDetail(formData);

      showToast("판매등록되었습니다.");

      window.setTimeout(() => {
        navigate("/");
      }, 700);
    } catch (error) {
      console.error(isEdit ? "상품 수정 실패" : "상품 등록 실패", error);
      showToast(isEdit ? "상품 수정에 실패했습니다." : "상품 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const isEditMode = editProductId !== null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {detailLoading ? (
          <div className={styles.detailStateBox}>상품 정보를 불러오는 중…</div>
        ) : detailLoadError ? (
          <div className={styles.detailErrorBox} role="alert">
            {detailLoadError}
          </div>
        ) : (
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
                onCityChange={setCity}
              />
            </div>
          </form>
        )}
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
            onClick={() => void handleSubmitClick()}
            disabled={submitting || detailLoading || !!detailLoadError}
          >
            {submitting
              ? isEditMode
                ? "수정 중..."
                : "등록 중..."
              : isEditMode
                ? "수정하기"
                : "판매하기"}
          </button>
        </div>
      </div>
    </div>
  );
}