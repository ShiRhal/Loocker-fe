import { Drawer } from "antd";
import type { DrawerProps } from "antd";
import React, { useEffect, useRef, useState } from "react";
import ChatListDrawer from "../drawers/ChatListDrawer";
import ChatRoomDrawer from "../drawers/ChatRoomDrawer";
import type { ChatRoomListItem } from "../types/chat";

type Props = {
  open: boolean;
  onClose: () => void;
  initialRoom: ChatRoomListItem | null;
  rightOffset?: number;
  mask?: boolean;
};

export default function ChatDrawer({
  open,
  onClose,
  initialRoom,
  rightOffset = 0,
  mask = true,
}: Props) {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomListItem | null>(
    null,
  );
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
    body: {
      padding: 0,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    },
    header: { display: "none" },
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
      width={640}
      mask={mask}
      zIndex={normalizedRightOffset > 0 ? 1200 : undefined}
      styles={drawerStyles}
      destroyOnClose
    >
      {selectedRoom == null ? (
        <ChatListDrawer onClose={handleClose} onSelectRoom={setSelectedRoom} />
      ) : (
        <ChatRoomDrawer
          room={selectedRoom}
          onBack={() => setSelectedRoom(null)}
          onClose={handleClose}
        />
      )}
    </Drawer>
  );
}
