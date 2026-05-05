import React, { useEffect, useState } from "react";
import { toApiAssetUrl } from "../../../shared/utils/imageUrl";
import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import { getChatRooms } from "../api/chatApi";
import type { ChatRoomListItem } from "../types/chat";
import styles from "./ChatListDrawer.module.css";

type Props = {
  onClose: () => void;
  onSelectRoom: (room: ChatRoomListItem) => void;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  try {
    const today = new Date();
    const messageDate = new Date(iso);
    const isSameYear = messageDate.getFullYear() === today.getFullYear();

    return messageDate.toLocaleString("ko-KR", {
      ...(isSameYear ? {} : { year: "numeric" }),
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export default function ChatListDrawer({ onClose, onSelectRoom }: Props) {
  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getChatRooms()
      .then((data) => {
        if (!cancelled) setRooms(Array.isArray(data) ? data : []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DrawerLayout title="채팅" onBack={onClose} mainClassName={styles.main}>
      {loading ? (
        <div className={styles.loading}>불러오는 중…</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : rooms.length === 0 ? (
        <div className={styles.emptyState}>
          <p>참여 중인 채팅방이 없습니다.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {rooms.map((room) => (
            <li key={room.CHAT_ROOM_ID}>
              <button
                type="button"
                className={styles.row}
                onClick={() => onSelectRoom(room)}
              >
                <div className={styles.rowInner}>
                  <div className={styles.thumbWrap}>
                    {room.IMAGE_URL ? (
                      <img
                        src={toApiAssetUrl(room.IMAGE_URL)}
                        alt={room.TITLE ?? `상품 ${room.PRODUCT_ID}`}
                        className={styles.thumb}
                      />
                    ) : (
                      <div className={styles.thumbPlaceholder}>이미지 없음</div>
                    )}
                  </div>
                  <div className={styles.content}>
                    <div className={styles.rowTitle}>
                      {room.TARGET_NICKNAME ?? `사용자 ${room.TARGET_USER_ID ?? "-"}`} ·{" "}
                      {room.TITLE ?? `상품 #${room.PRODUCT_ID}`}
                    </div>
                    {room.LAST_MESSAGE ? (
                      <div className={styles.preview}>{room.LAST_MESSAGE}</div>
                    ) : null}
                    <div className={styles.rowMeta}>
                      {formatWhen(room.LAST_CHAT_TIME ?? null)}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DrawerLayout>
  );
}
