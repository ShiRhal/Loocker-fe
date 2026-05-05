export type ChatMessage = {
  CHAT_MESSAGE_ID: number;
  CHAT_ROOM_ID: number;
  SENDER_ID: number;
  MESSAGE: string;
  CREATED_AT: string;
};

export type ChatRoomListItem = {
  CHAT_ROOM_ID: number;
  PRODUCT_ID: number;
  SELLER_ID?: number | null;
  BUYER_ID?: number | null;
  TITLE?: string | null;
  TARGET_USER_ID?: number | null;
  TARGET_NICKNAME?: string | null;
  IMAGE_URL?: string | null;
  CREATED_AT: string;
  LAST_MESSAGE?: string | null;
  LAST_CHAT_TIME?: string | null;
};
