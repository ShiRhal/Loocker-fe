import { Outlet } from "react-router-dom";
import NavBar from "../shared/components/NavBar/NavBar";

export default function AppLayout() {
  return (
    <>
      <NavBar />
      <main style={{ maxWidth: 1024, margin: "0 auto", padding: 16 }}>
        <Outlet />
      </main>
    </>
  );
}
