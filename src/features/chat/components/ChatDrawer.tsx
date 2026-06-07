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

  const normalizedRightOffset = Math.max(0, rightOffset);

  const drawerStyles: DrawerProps["styles"] = {
    content: {
      height: "100dvh",
      overflow: "hidden",
    },
    body: {
      padding: 0,
      height: "100dvh",
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    header: {
      display: "none",
    },
    wrapper:
      normalizedRightOffset > 0
        ? {
            right: normalizedRightOffset,
            insetInlineEnd: normalizedRightOffset,
          }
        : undefined,
  };

  return (
    <Drawer
      placement="right"
      onClose={handleClose}
      open={open}
      closable={false}
      width="min(640px, 100vw)"
      mask={mask}
      zIndex={normalizedRightOffset > 0 ? 1200 : undefined}
      styles={drawerStyles}
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