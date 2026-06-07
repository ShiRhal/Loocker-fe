import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const messagesRef = useRef<HTMLDivElement | null>(null);

  const myUserId = useMemo(() => {
    const raw = localStorage.getItem("userId");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, []);

  const scrollToBottom = useCallback(() => {
    window.requestAnimationFrame(() => {
      const el = messagesRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }, []);

  const onIncoming = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (
        msg.CHAT_MESSAGE_ID != null &&
        prev.some((m) => m.CHAT_MESSAGE_ID === msg.CHAT_MESSAGE_ID)
      ) {
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
          setError(
            e instanceof Error ? e.message : "메시지를 불러오지 못했습니다.",
          );
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
    scrollToBottom();
  }, [messages.length, loading, scrollToBottom]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      void reloadMessages().catch(() => {});
    }, 1500);

    return () => {
      window.clearInterval(timerId);
    };
  }, [reloadMessages]);

  useEffect(() => {
    const handleViewportChange = () => {
      window.setTimeout(scrollToBottom, 50);
      window.setTimeout(scrollToBottom, 250);
      window.setTimeout(scrollToBottom, 450);
    };

    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
      window.visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [scrollToBottom]);

  const handleInputFocus = () => {
    window.setTimeout(scrollToBottom, 50);
    window.setTimeout(scrollToBottom, 250);
    window.setTimeout(scrollToBottom, 450);
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !connected) return;

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

    window.setTimeout(() => {
      void reloadMessages().catch(() => {});
    }, 250);
  };

  const footer = (
    <div className={styles.footerInner}>
      <textarea
        className={styles.input}
        rows={2}
        placeholder="메시지를 입력하세요"
        value={draft}
        onFocus={handleInputFocus}
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
        <div ref={messagesRef} className={styles.messages}>
          {messages.map((m) => {
            const mine = myUserId !== null && m.SENDER_ID === myUserId;

            return (
              <div
                key={m.CHAT_MESSAGE_ID}
                className={`${styles.bubble} ${
                  mine ? styles.bubbleMine : styles.bubbleOther
                }`}
              >
                <div>{m.MESSAGE}</div>
                <div className={styles.meta}>
                  {mine ? "나" : `${room.TARGET_NICKNAME}`} ·{" "}
                  {formatTime(m.CREATED_AT)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DrawerLayout>
  );
}