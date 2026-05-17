import { useEffect, useState } from "react";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";
import type { ProductImage } from "../types/product.types";
import styles from "../pages/ProductDetailPage.module.css";

type ProductImageGalleryProps = {
  images?: ProductImage[];
  title: string;
};

function isPrimaryImage(image: ProductImage) {
  return image.IS_PRIMARY === true || image.IS_PRIMARY === 1;
}

function getProductImageUrls(images?: ProductImage[]) {
  if (!images || images.length === 0) return [];

  return [...images]
    .sort((a, b) => {
      const aPrimary = isPrimaryImage(a);
      const bPrimary = isPrimaryImage(b);

      if (aPrimary !== bPrimary) {
        return aPrimary ? -1 : 1;
      }

      return (a.SORT_ORDER ?? 0) - (b.SORT_ORDER ?? 0);
    })
    .map((image) => toApiAssetUrl(image.IMAGE_URL));
}

export function getPrimaryProductImageUrl(images?: ProductImage[]) {
  const imageUrls = getProductImageUrls(images);
  return imageUrls[0] ?? "";
}

export default function ProductImageGallery({
  images,
  title,
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [images]);

  const imageUrls = getProductImageUrls(images);
  const selectedImageUrl = imageUrls[selectedImageIndex] ?? "";

  return (
    <div className={styles.imageArea}>
      {selectedImageUrl ? (
        <img src={selectedImageUrl} alt={title} className={styles.mainImage} />
      ) : (
        <div className={styles.emptyImage}>이미지 없음</div>
      )}

      {imageUrls.length > 1 && (
        <div className={styles.thumbnailList}>
          {imageUrls.map((imageUrl, index) => (
            <button
              key={`${imageUrl}-${index}`}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={`${styles.thumbnailButton} ${
                selectedImageIndex === index ? styles.thumbnailButtonActive : ""
              }`}
            >
              <img
                src={imageUrl}
                alt={`${title} 이미지 ${index + 1}`}
                className={styles.thumbnailImage}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
