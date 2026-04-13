import { useEffect, useMemo, useState } from "react";

export type ProductImageItem = {
  id: string;
  file: File;
  previewUrl: string;
};

export type ProductFormState = {
  FILES: File[];
  NEW_ID: 0;
  ACCESSORY_STATUS: string;
  BASE_PRICE: number | "";
  SUB_CATEGORY: string;
  NICKNAME: string;
  TRADE_TYPE: string[];
  DESCRIPTION: string;
  CITY: string | null;
  TITLE: string;
};

export type ProductFormErrors = {
  TITLE: boolean;
  BASE_PRICE: boolean;
  DESCRIPTION: boolean;
};

export default function useProductForm() {
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [toastMessage, setToastMessage] = useState("");

  const [form, setForm] = useState<ProductFormState>({
    FILES: [],
    NEW_ID: 0,
    ACCESSORY_STATUS: "",
    BASE_PRICE: "",
    SUB_CATEGORY: "",
    NICKNAME: "",
    TRADE_TYPE: [],
    DESCRIPTION: "",
    CITY: null,
    TITLE: "",
  });

  const [errors, setErrors] = useState<ProductFormErrors>({
    TITLE: false,
    BASE_PRICE: false,
    DESCRIPTION: false,
  });

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => {
      setToastMessage("");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const imageFiles = useMemo(() => {
    return images.map((item) => item.file);
  }, [images]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      FILES: imageFiles,
    }));
  }, [imageFiles]);

  const addImages = (files: File[]) => {
    if (files.length === 0) return;

    const remainingCount = 10 - images.length;

    if (remainingCount <= 0) {
      showToast("이미지는 최대 10장까지 등록할 수 있습니다.");
      return;
    }

    const filesToAdd = files.slice(0, remainingCount);

    if (files.length > remainingCount) {
      showToast("이미지는 최대 10장까지 등록할 수 있습니다.");
    }

    const newItems: ProductImageItem[] = filesToAdd.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newItems]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((item) => item.id !== id);
    });

    showToast("삭제되었습니다.");
  };

  const setTitle = (value: string) => {
    const limitedValue = value.slice(0, 64);

    setForm((prev) => ({
      ...prev,
      TITLE: limitedValue,
    }));

    if (limitedValue.trim().length >= 2) {
      setErrors((prev) => ({
        ...prev,
        TITLE: false,
      }));
    }
  };

  const setSubCategory = (value: string) => {
    setForm((prev) => ({
      ...prev,
      SUB_CATEGORY: value,
    }));
  };

  const setBasePrice = (value: number | "") => {
    const limitedValue =
      value === "" ? "" : Math.min(Number(value), 99_999_999);

    setForm((prev) => ({
      ...prev,
      BASE_PRICE: limitedValue,
    }));

    if (limitedValue !== "" && Number(limitedValue) > 0) {
      setErrors((prev) => ({
        ...prev,
        BASE_PRICE: false,
      }));
    }
  };

  const setDescription = (value: string) => {
    setForm((prev) => ({
      ...prev,
      DESCRIPTION: value,
    }));

    if (value.trim().length >= 10) {
      setErrors((prev) => ({
        ...prev,
        DESCRIPTION: false,
      }));
    }
  };

  const setAccessoryStatus = (value: string) => {
    setForm((prev) => ({
      ...prev,
      ACCESSORY_STATUS: value,
    }));
  };

  const setTradeType = (value: string[]) => {
    setForm((prev) => ({
      ...prev,
      TRADE_TYPE: value,
    }));
  };

  const setCity = (value: string | null) => {
    setForm((prev) => ({
      ...prev,
      CITY: value,
    }));
  };

  const validateBeforeSubmit = () => {
    const nextErrors: ProductFormErrors = {
      TITLE: false,
      BASE_PRICE: false,
      DESCRIPTION: false,
    };

    if (form.TITLE.trim().length < 2) {
      nextErrors.TITLE = true;
      setErrors(nextErrors);

      return {
        isValid: false,
        focusField: "TITLE" as const,
      };
    }

    if (form.BASE_PRICE === "" || Number(form.BASE_PRICE) <= 0) {
      nextErrors.BASE_PRICE = true;
      setErrors(nextErrors);

      return {
        isValid: false,
        focusField: "BASE_PRICE" as const,
      };
    }

    if (form.DESCRIPTION.trim().length < 10) {
      nextErrors.DESCRIPTION = true;
      setErrors(nextErrors);

      return {
        isValid: false,
        focusField: "DESCRIPTION" as const,
      };
    }

    setErrors(nextErrors);

    if (!form.ACCESSORY_STATUS) {
      showToast("구성품을 선택해주세요.");
      return {
        isValid: false,
        focusField: null,
      };
    }

    if (form.TRADE_TYPE.length === 0) {
      showToast("거래방법을 1개이상 선택해주세요.");
      return {
        isValid: false,
        focusField: null,
      };
    }

    if (!form.SUB_CATEGORY.trim()) {
      showToast("카테고리를 선택해주세요.");
      return {
        isValid: false,
        focusField: null,
      };
    }

    const imageOnlyFiles = form.FILES.filter((file) =>
      file.type.startsWith("image/"),
    );

    if (imageOnlyFiles.length === 0) {
      showToast("이미지를 1개이상 첨부해주세요.");
      return {
        isValid: false,
        focusField: null,
      };
    }

    return {
      isValid: true,
      focusField: null,
    };
  };

  useEffect(() => {
    return () => {
      images.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [images]);

  return {
    form,
    errors,
    images,
    imageFiles,
    toastMessage,
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
  };
}
