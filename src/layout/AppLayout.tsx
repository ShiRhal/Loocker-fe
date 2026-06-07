import { useMemo, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import ChatDrawer from "../features/chat/components/ChatDrawer";
import {
  ChatDrawerContext,
  type ChatDrawerOpenOptions,
} from "../features/chat/context/ChatDrawerContext";
import type { ChatRoomListItem } from "../features/chat/types/chat";
import NavBar from "../shared/components/NavBar/NavBar";
import styles from "./AppLayout.module.css";

export default function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDrawerOptions, setChatDrawerOptions] =
    useState<ChatDrawerOpenOptions>({});
  const [initialChatRoom, setInitialChatRoom] =
    useState<ChatRoomListItem | null>(null);

  const closeChatDrawer = useCallback(() => {
    setChatOpen(false);
    setInitialChatRoom(null);
    setChatDrawerOptions({});
  }, []);

  const chatDrawerApi = useMemo(
    () => ({
      openChatList: (options?: ChatDrawerOpenOptions) => {
        setInitialChatRoom(null);
        setChatDrawerOptions(options ?? {});
        setChatOpen(true);
      },
      openChatRoom: (
        room: ChatRoomListItem,
        options?: ChatDrawerOpenOptions,
      ) => {
        setInitialChatRoom(room);
        setChatDrawerOptions(options ?? {});
        setChatOpen(true);
      },
      closeChat: closeChatDrawer,
    }),
    [closeChatDrawer],
  );

  return (
    <ChatDrawerContext.Provider value={chatDrawerApi}>
      <>
        <NavBar onOpenChat={chatDrawerApi.openChatList} />
        <ChatDrawer
          open={chatOpen}
          onClose={closeChatDrawer}
          initialRoom={initialChatRoom}
          rightOffset={chatDrawerOptions.rightOffset ?? 0}
          mask={chatDrawerOptions.mask ?? true}
        />
        <main className={styles.main}>
          <Outlet />
        </main>
      </>
    </ChatDrawerContext.Provider>
  );
}
