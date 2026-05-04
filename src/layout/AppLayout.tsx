import { useState } from "react";
import { Outlet } from "react-router-dom";
import ChatDrawer from "../features/chat/components/ChatDrawer";
import NavBar from "../shared/components/NavBar/NavBar";

export default function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <NavBar onOpenChat={() => setChatOpen(true)} />
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px 80px" }}>
        <Outlet />
      </main>
    </>
  );
}