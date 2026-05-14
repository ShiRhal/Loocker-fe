import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import ChatDrawer from "../features/chat/components/ChatDrawer";
import { ChatDrawerContext } from "../features/chat/context/ChatDrawerContext";
import type { ChatRoomListItem } from "../features/chat/types/chat";
import NavBar from "../shared/components/NavBar/NavBar";

export default function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [initialChatRoom, setInitialChatRoom] = useState<ChatRoomListItem | null>(
    null,
  );

  const chatDrawerApi = useMemo(
    () => ({
      openChatList: () => {
        setInitialChatRoom(null);
        setChatOpen(true);
      },
      openChatRoom: (room: ChatRoomListItem) => {
        setInitialChatRoom(room);
        setChatOpen(true);
      },
    }),
    [],
  );

  const handleCloseChat = () => {
    setChatOpen(false);
    setInitialChatRoom(null);
  };

  return (
    <ChatDrawerContext.Provider value={chatDrawerApi}>
      <>
        <NavBar onOpenChat={chatDrawerApi.openChatList} />
        <ChatDrawer
          open={chatOpen}
          onClose={handleCloseChat}
          initialRoom={initialChatRoom}
        />
        <main
          style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px 80px" }}
        >
          <Outlet />
        </main>
      </>
    </ChatDrawerContext.Provider>
  );
}
