import { createContext, useContext } from "react";
import type { ChatRoomListItem } from "../types/chat";

export type ChatDrawerOpenOptions = {
  rightOffset?: number;
  mask?: boolean;
};

export type ChatDrawerApi = {
  openChatList: (options?: ChatDrawerOpenOptions) => void;
  openChatRoom: (
    room: ChatRoomListItem,
    options?: ChatDrawerOpenOptions,
  ) => void;
  closeChat: () => void;
};

export const ChatDrawerContext = createContext<ChatDrawerApi | null>(null);

export function useChatDrawer(): ChatDrawerApi {
  const ctx = useContext(ChatDrawerContext);
  if (!ctx) {
    throw new Error(
      "useChatDrawer must be used within ChatDrawerContext.Provider",
    );
  }
  return ctx;
}
