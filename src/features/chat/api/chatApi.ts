import { api } from "../../../app/config/api";
import type { ChatMessage, ChatRoomListItem } from "../types/chat";

type RawRecord = Record<string, unknown>;

function pick(raw: RawRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in raw) return raw[key];
  }
  return undefined;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function normalizeRoom(raw: unknown): ChatRoomListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as RawRecord;

  const chatRoomId = toNullableNumber(pick(r, "CHAT_ROOM_ID", "chat_ROOM_ID", "chatRoomId"));
  const productId = toNullableNumber(pick(r, "PRODUCT_ID", "product_ID", "productId"));
  const createdAt = toNullableString(pick(r, "CREATED_AT", "created_AT", "createdAt"));

  if (chatRoomId == null || productId == null || !createdAt) return null;

  return {
    CHAT_ROOM_ID: chatRoomId,
    PRODUCT_ID: productId,
    SELLER_ID: toNullableNumber(pick(r, "SELLER_ID", "seller_ID", "sellerId")),
    BUYER_ID: toNullableNumber(pick(r, "BUYER_ID", "buyer_ID", "buyerId")),
    TITLE: toNullableString(pick(r, "TITLE", "title")),
    TARGET_USER_ID: toNullableNumber(pick(r, "TARGET_USER_ID", "target_USER_ID", "targetUserId")),
    TARGET_NICKNAME: toNullableString(pick(r, "TARGET_NICKNAME", "target_NICKNAME", "targetNickname")),
    IMAGE_URL: toNullableString(pick(r, "IMAGE_URL", "image_URL", "imageUrl")),
    CREATED_AT: createdAt,
    LAST_MESSAGE: toNullableString(pick(r, "LAST_MESSAGE", "last_MESSAGE", "lastMessage")),
    LAST_CHAT_TIME: toNullableString(pick(r, "LAST_CHAT_TIME", "last_CHAT_TIME", "lastChatTime")),
  };
}

function normalizeMessage(raw: unknown): ChatMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as RawRecord;

  const chatMessageId = toNullableNumber(pick(r, "CHAT_MESSAGE_ID", "chat_MESSAGE_ID", "chatMessageId"));
  const chatRoomId = toNullableNumber(pick(r, "CHAT_ROOM_ID", "chat_ROOM_ID", "chatRoomId"));
  const senderId = toNullableNumber(pick(r, "SENDER_ID", "sender_ID", "senderId"));
  const message = toNullableString(pick(r, "MESSAGE", "message"));
  const createdAt = toNullableString(pick(r, "CREATED_AT", "created_AT", "createdAt"));

  if (chatMessageId == null || chatRoomId == null || senderId == null || !message || !createdAt) {
    return null;
  }

  return {
    CHAT_MESSAGE_ID: chatMessageId,
    CHAT_ROOM_ID: chatRoomId,
    SENDER_ID: senderId,
    MESSAGE: message,
    CREATED_AT: createdAt
  };
}

export async function getChatRooms(): Promise<ChatRoomListItem[]> {
  const data = (await api("/chat/rooms")) as unknown;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeRoom).filter((item): item is ChatRoomListItem => item !== null);
}

export async function getChatMessages(roomId: number): Promise<ChatMessage[]> {
  const data = (await api(`/chat/rooms/${roomId}/messages`)) as unknown;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeMessage).filter((item): item is ChatMessage => item !== null);
}
