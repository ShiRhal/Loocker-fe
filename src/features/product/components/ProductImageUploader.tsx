import { useRef, type ChangeEvent } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Scrollbar } from "swiper/modules";
import styles from "./ProductImageUploader.module.css";
import type { ProductImageItem } from "../hooks/useProductForm";

import "swiper/css";
import "swiper/css/scrollbar";

type ProductImageUploaderProps = {
  images: ProductImageItem[];
  toastMessage: string;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
};

export default function ProductImageUploader({
  images,
  toastMessage,
  onAddImages,
  onRemoveImage,
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadBoxClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    onAddImages(selectedFiles);
    event.target.value = "";
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.uploadButton}
        onClick={handleUploadBoxClick}
      >
        <span className={styles.cameraIcon} aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1792 1792"
            className={styles.cameraSvg}
          >
            <path
              fill="#787E89"
              d="M896 672q119 0 203.5 84.5T1184 960t-84.5 203.5T896 1248t-203.5-84.5T608 960t84.5-203.5T896 672zm704-416q106 0 181 75t75 181v896q0 106-75 181t-181 75H192q-106 0-181-75t-75-181V512q0-106 75-181t181-75h224l51-136q19-49 69.5-84.5T640 0h512q53 0 103.5 35.5T1325 120l51 136h224zM896 1408q185 0 316.5-131.5T1344 960t-131.5-316.5T896 512 579.5 643.5 448 960t131.5 316.5T896 1408z"
            />
          </svg>
        </span>
        <span className={styles.countText}>{images.length}/10</span>
      </button>

      <input
        ref={inputRef}
        className={styles.hiddenInput}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <div className={styles.sliderSection}>
        <Swiper
          modules={[Scrollbar]}
          slidesPerView="auto"
          spaceBetween={12}
          scrollbar={{ draggable: true }}
          className={styles.swiper}
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id} className={styles.swiperSlide}>
              <div className={styles.previewItem}>
                <img
                  src={image.previewUrl}
                  alt={`상품 이미지 ${index + 1}`}
                  className={styles.previewImage}
                />

                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => onRemoveImage(image.id)}
                  aria-label={`상품 이미지 ${index + 1} 삭제`}
                >
                  ×
                </button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {toastMessage && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
