import { Drawer } from "antd";
import React, { useEffect, useState } from "react";
import ChatListDrawer from "../drawers/ChatListDrawer";
import ChatRoomDrawer from "../drawers/ChatRoomDrawer";
import type { ChatRoomListItem } from "../types/chat";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedChatRoom: ChatRoomListItem | null;
};

export default function ChatDrawer({ open, onClose, selectedChatRoom }: Props) {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomListItem | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedRoom(selectedChatRoom);
    } else {
      setSelectedRoom(null);
    }
  }, [open, selectedChatRoom]);

  const handleClose = () => {
    setSelectedRoom(null);
    onClose();
  };

  return (
    <Drawer
      placement="right"
      onClose={handleClose}
      open={open}
      closable={false}
      width={640}
      styles={{
        body: { padding: 0, minHeight: "100vh", display: "flex", flexDirection: "column" },
        header: { display: "none" },
      }}
      destroyOnClose
    >
      {selectedRoom == null ? (
        <ChatListDrawer onClose={handleClose} onSelectRoom={setSelectedRoom} />
      ) : (
        <ChatRoomDrawer room={selectedRoom} onBack={() => setSelectedRoom(null)} onClose={handleClose} />
      )}
    </Drawer>
  );
}
