import React, { useCallback, useEffect, useMemo, useState } from "react";
import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import { getChatMessages } from "../api/chatApi";
import { useChatSocket } from "../socket/useChatSocket";
import type { ChatMessage, ChatRoomListItem } from "../types/chat";
import styles from "./ChatRoomDrawer.module.css";

type Props = {
  room: ChatRoomListItem;
  onBack: () => void;
  onClose: () => void;
};

function formatTime(iso: string): string {
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

export default function ChatRoomDrawer({ room, onBack, onClose }: Props) {
  const roomId = room.CHAT_ROOM_ID;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const myUserId = useMemo(() => {
    const raw = localStorage.getItem("userId");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, []);

  const onIncoming = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      // 서버 payload에 ID가 없는 경우(undefined/null)까지 동일 ID로 간주하면
      // 이후 수신 메시지가 전부 중복으로 처리될 수 있어, ID가 있을 때만 dedupe한다.
      if (msg.CHAT_MESSAGE_ID != null && prev.some((m) => m.CHAT_MESSAGE_ID === msg.CHAT_MESSAGE_ID)) {
        return prev;
      }
      return [...prev, msg];
    });
  }, []);

  const { connected, sendMessage } = useChatSocket(roomId, onIncoming);

  const reloadMessages = useCallback(async () => {
    const data = await getChatMessages(roomId);
    setMessages(Array.isArray(data) ? data : []);
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void reloadMessages()
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "메시지를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadMessages]);

  useEffect(() => {
    // WebSocket 수신 누락/지연 시 상대 메시지를 빠르게 보정하기 위한 안전망
    const timerId = window.setInterval(() => {
      void reloadMessages().catch(() => {
        // 일시적인 조회 실패는 다음 주기에 재시도
      });
    }, 1500);

    return () => {
      window.clearInterval(timerId);
    };
  }, [reloadMessages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !connected) return;

    // 브로드캐스트 지연/누락이 있어도 즉시 UI에 보이도록 낙관적 반영
    const tempId = -Date.now();
    const nowIso = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      {
        CHAT_MESSAGE_ID: tempId,
        CHAT_ROOM_ID: roomId,
        SENDER_ID: myUserId ?? 0,
        MESSAGE: text,
        CREATED_AT: nowIso,
      },
    ]);

    sendMessage(text);
    setDraft("");

    // 서버 최종 상태와 동기화 (임시 메시지 -> 실제 메시지 치환)
    window.setTimeout(() => {
      void reloadMessages().catch(() => {
        // 재조회 실패 시에도 낙관적 메시지는 유지
      });
    }, 250);
  };

  const footer = (
    <div className={styles.footerInner}>
      <textarea
        className={styles.input}
        rows={2}
        placeholder="메시지를 입력하세요"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        type="button"
        className={styles.sendBtn}
        disabled={!connected || !draft.trim()}
        onClick={handleSend}
      >
        전송
      </button>
    </div>
  );

  return (
    <DrawerLayout
      title={`${room.TITLE}`}
      onBack={onBack}
      mainClassName={styles.main}
      footer={footer}
      headerAction={
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 13,
            color: "#1677ff",
          }}
        >
          닫기
        </button>
      }
    >

      {loading ? (
        <div className={styles.loading}>메시지 불러오는 중…</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.messages}>
          {messages.map((m) => {
            const mine = myUserId !== null && m.SENDER_ID === myUserId;
            return (
              <div
                key={m.CHAT_MESSAGE_ID}
                className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleOther}`}
              >
                <div>{m.MESSAGE}</div>
                <div className={styles.meta}>
                  {mine ? "나" : `${room.TARGET_NICKNAME}`} · {formatTime(m.CREATED_AT)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DrawerLayout>
  );
}
