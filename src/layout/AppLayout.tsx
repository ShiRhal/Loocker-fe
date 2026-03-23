import { Outlet } from "react-router-dom";
import NavBar from "../shared/components/NavBar/NavBar";

export default function AppLayout() {
  return (
    <>
      <NavBar />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px 80px" }}>
        <Outlet />
      </main>
    </>
  );
}