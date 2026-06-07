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
  const [drawerHeight, setDrawerHeight] = useState("100dvh");
  const [drawerTop, setDrawerTop] = useState("0px");

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

  useEffect(() => {
    if (!open) return;

    const updateViewportSize = () => {
      const viewport = window.visualViewport;

      if (viewport) {
        setDrawerHeight(`${Math.round(viewport.height)}px`);
        setDrawerTop(`${Math.round(viewport.offsetTop)}px`);
        return;
      }

      setDrawerHeight(`${window.innerHeight}px`);
      setDrawerTop("0px");
    };

    updateViewportSize();

    window.visualViewport?.addEventListener("resize", updateViewportSize);
    window.visualViewport?.addEventListener("scroll", updateViewportSize);
    window.addEventListener("resize", updateViewportSize);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportSize);
      window.visualViewport?.removeEventListener("scroll", updateViewportSize);
      window.removeEventListener("resize", updateViewportSize);
    };
  }, [open]);

  const handleClose = () => {
    setSelectedRoom(null);
    onClose();
  };

  const normalizedRightOffset = Math.max(0, rightOffset);

  const wrapperStyle: React.CSSProperties = {
    height: drawerHeight,
    maxHeight: drawerHeight,
    top: drawerTop,
    bottom: "auto",
  };

  if (normalizedRightOffset > 0) {
    wrapperStyle.right = normalizedRightOffset;
    wrapperStyle.insetInlineEnd = normalizedRightOffset;
  }

  const drawerStyles: DrawerProps["styles"] = {
    wrapper: wrapperStyle,
    content: {
      height: drawerHeight,
      maxHeight: drawerHeight,
      overflow: "hidden",
    },
    body: {
      padding: 0,
      height: drawerHeight,
      maxHeight: drawerHeight,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    header: {
      display: "none",
    },
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
        <ChatRoomDrawer
          room={selectedRoom}
          onBack={() => setSelectedRoom(null)}
          onClose={handleClose}
        />
      )}
    </Drawer>
  );
}