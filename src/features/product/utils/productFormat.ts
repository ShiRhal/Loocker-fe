export type TradeTypeCode = "DIRECT" | "LOCKER" | "DELIVERY";

const TRADE_TYPE_LABEL: Record<TradeTypeCode, string> = {
  DIRECT: "직거래",
  LOCKER: "보관함 거래",
  DELIVERY: "택배거래",
};

const ACCESSORY_STATUS_LABEL: Record<string, string> = {
  ALL: "구성품 전부 포함",
  PARTIAL: "구성품 일부 포함",
  NONE: "구성품 미포함",
};

export function formatProductPrice(price?: number) {
  if (price == null) return "가격 정보 없음";
  return `${price.toLocaleString()}원`;
}

export function formatProductCreatedAt(createdAt?: string) {
  if (!createdAt) return "";

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function getAccessoryStatusLabel(status?: string) {
  if (!status) return "상품 상태 정보 없음";
  return ACCESSORY_STATUS_LABEL[status] ?? status;
}

export function getTradeTypes(tradeType?: string): TradeTypeCode[] {
  if (!tradeType) return [];

  return tradeType
    .split("|")
    .map((value) => value.trim())
    .filter((value): value is TradeTypeCode =>
      ["DIRECT", "LOCKER", "DELIVERY"].includes(value),
    );
}

export function getTradeLabel(type: TradeTypeCode) {
  return TRADE_TYPE_LABEL[type];
}

export function getLocationText(state?: string | null, city?: string | null) {
  return [state, city].filter(Boolean).join(" ");
}

export function getTradeTitle(
  tradeTypes: TradeTypeCode[],
  hasRegion: boolean,
) {
  if (!hasRegion) {
    return "무료배송";
  }

  if (tradeTypes.length === 0) {
    return "거래 방식 정보 없음";
  }

  return tradeTypes.map(getTradeLabel).join(" | ");
}