import { Drawer } from "antd";
import React, { useEffect, useRef, useState } from "react";
import ChatListDrawer from "../drawers/ChatListDrawer";
import ChatRoomDrawer from "../drawers/ChatRoomDrawer";
import type { ChatRoomListItem } from "../types/chat";

type Props = {
  open: boolean;
  onClose: () => void;
  /** 드로어가 닫혔다가 열릴 때만 적용. null이면 채팅 목록부터 표시. */
  initialRoom: ChatRoomListItem | null;
};

export default function ChatDrawer({ open, onClose, initialRoom }: Props) {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomListItem | null>(null);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setSelectedRoom(initialRoom);
    }
    if (!open) {
      setSelectedRoom(null);
    }
    prevOpenRef.current = open;
  }, [open, initialRoom]);

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
