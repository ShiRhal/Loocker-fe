export type RecentViewedItem = {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  isSold: boolean;
  viewedAt: number;
};

const RECENT_VIEWED_KEY = "recentViewedProducts";
const MAX_RECENT_VIEWED_COUNT = 3;

function safeParseRecentViewed(value: string | null): RecentViewedItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => {
        return (
          typeof item.id === "number" &&
          typeof item.title === "string" &&
          typeof item.price === "number" &&
          typeof item.imageUrl === "string" &&
          typeof item.viewedAt === "number"
        );
      })
      .map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        imageUrl: item.imageUrl,
        isSold: typeof item.isSold === "boolean" ? item.isSold : false,
        viewedAt: item.viewedAt,
      }));
  } catch {
    return [];
  }
}

export function getRecentViewedProducts(): RecentViewedItem[] {
  const savedValue = localStorage.getItem(RECENT_VIEWED_KEY);

  return safeParseRecentViewed(savedValue).sort(
    (a, b) => b.viewedAt - a.viewedAt,
  );
}

export function addRecentViewedProduct(
  item: Omit<RecentViewedItem, "viewedAt" | "isSold"> & {
    isSold?: boolean;
  },
) {
  const currentItems = getRecentViewedProducts();

  const nextItems: RecentViewedItem[] = [
    {
      ...item,
      isSold: item.isSold ?? false,
      viewedAt: Date.now(),
    },
    ...currentItems.filter((currentItem) => currentItem.id !== item.id),
  ].slice(0, MAX_RECENT_VIEWED_COUNT);

  localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(nextItems));

  window.dispatchEvent(new Event("recentViewedProductsChanged"));
}

export function removeRecentViewedProduct(productId: number) {
  const currentItems = getRecentViewedProducts();

  const nextItems = currentItems.filter((item) => item.id !== productId);

  localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(nextItems));

  window.dispatchEvent(new Event("recentViewedProductsChanged"));
}