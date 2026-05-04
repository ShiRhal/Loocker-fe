import { useEffect, useState } from "react";

export type ProductImageItem = {
  id: string;
  file: File;
  previewUrl: string;
};

export type ProductFormErrors = {
  TITLE?: string;
  BASE_PRICE?: string;
  DESCRIPTION?: string;
};

type ProductFormState = {
  TITLE: string;
  SUB_CATEGORY: string;
  BASE_PRICE: number | "";
  DESCRIPTION: string;
  ACCESSORY_STATUS: string;
  TRADE_TYPE: string[];
  CITY: string | null;
  FILES: File[];
};

type ValidateResult = {
  isValid: boolean;
  focusField?: "TITLE" | "BASE_PRICE" | "DESCRIPTION";
};

const MAX_IMAGE_COUNT = 10;

export default function useProductForm() {
  const [form, setForm] = useState<ProductFormState>({
    TITLE: "",
    SUB_CATEGORY: "",
    BASE_PRICE: "",
    DESCRIPTION: "",
    ACCESSORY_STATUS: "NONE",
    TRADE_TYPE: [],
    CITY: null,
    FILES: [],
  });

  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    return () => {
      images.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, [images]);

  const showToast = (message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage("");
    }, 1800);
  };

  const setTitle = (value: string) => {
    setForm((prev) => ({
      ...prev,
      TITLE: value,
    }));

    setErrors((prev) => ({
      ...prev,
      TITLE: undefined,
    }));
  };

  const setSubCategory = (value: string) => {
    setForm((prev) => ({
      ...prev,
      SUB_CATEGORY: value,
    }));
  };

  const setBasePrice = (value: number | "") => {
    setForm((prev) => ({
      ...prev,
      BASE_PRICE: value,
    }));

    setErrors((prev) => ({
      ...prev,
      BASE_PRICE: undefined,
    }));
  };

  const setDescription = (value: string) => {
    setForm((prev) => ({
      ...prev,
      DESCRIPTION: value,
    }));

    setErrors((prev) => ({
      ...prev,
      DESCRIPTION: undefined,
    }));
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

  const addImages = (files: File[]) => {
    if (files.length === 0) return;

    const availableCount = MAX_IMAGE_COUNT - images.length;

    if (availableCount <= 0) {
      showToast("이미지는 최대 10장까지 등록할 수 있습니다.");
      return;
    }

    const selectedFiles = files.slice(0, availableCount);

    if (files.length > availableCount) {
      showToast("이미지는 최대 10장까지 등록할 수 있습니다.");
    }

    const nextImages = selectedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...nextImages]);

    setForm((prev) => ({
      ...prev,
      FILES: [...prev.FILES, ...selectedFiles],
    }));
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const targetImage = prev.find((image) => image.id === id);

      if (targetImage) {
        URL.revokeObjectURL(targetImage.previewUrl);
      }

      const nextImages = prev.filter((image) => image.id !== id);

      setForm((prevForm) => ({
        ...prevForm,
        FILES: nextImages.map((image) => image.file),
      }));

      return nextImages;
    });
  };

  const validateBeforeSubmit = (): ValidateResult => {
    const nextErrors: ProductFormErrors = {};

    if (!form.TITLE.trim()) {
      nextErrors.TITLE = "상품명을 입력해 주세요.";
    }

    if (form.BASE_PRICE === "" || form.BASE_PRICE <= 0) {
      nextErrors.BASE_PRICE = "가격을 입력해 주세요.";
    }

    if (!form.DESCRIPTION.trim()) {
      nextErrors.DESCRIPTION = "상품 설명을 입력해 주세요.";
    }

    setErrors(nextErrors);

    if (nextErrors.TITLE) {
      return {
        isValid: false,
        focusField: "TITLE",
      };
    }

    if (nextErrors.BASE_PRICE) {
      return {
        isValid: false,
        focusField: "BASE_PRICE",
      };
    }

    if (nextErrors.DESCRIPTION) {
      return {
        isValid: false,
        focusField: "DESCRIPTION",
      };
    }

    if (form.TRADE_TYPE.length === 0) {
      showToast("거래방법을 1개이상 선택해주세요.");
      return {
        isValid: false,
      };
    }

    return {
      isValid: true,
    };
  };

  return {
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
  };
}
