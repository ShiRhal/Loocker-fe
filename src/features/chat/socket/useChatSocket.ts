import { useCallback, useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE } from "../../../app/config/api";
import type { ChatMessage } from "../types/chat";

type OnIncoming = (msg: ChatMessage) => void;

export function useChatSocket(roomId: number | null, onIncoming: OnIncoming) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const onIncomingRef = useRef(onIncoming);
  onIncomingRef.current = onIncoming;

  useEffect(() => {
    if (roomId == null) {
      setConnected(false);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setConnected(false);
      return;
    }

    const base = API_BASE.replace(/\/+$/, "");
    const wsUrl = `${base}/ws-chat`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as unknown as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/chat.${roomId}`, (message: IMessage) => {
          try {
            const body = JSON.parse(message.body) as ChatMessage;
            onIncomingRef.current(body);
          } catch {
            /* ignore malformed payload */
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    clientRef.current = client;
    client.activate();

    return () => {
      void client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [roomId]);

  const sendMessage = useCallback(
    (text: string) => {
      const c = clientRef.current;
      const rid = roomId;
      if (!c?.connected || rid == null) return;
      c.publish({
        destination: `/app/chat/${rid}/send`,
        body: JSON.stringify({ MESSAGE: text }),
      });
    },
    [roomId],
  );

  return { connected, sendMessage };
}
