import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../../layout/AppLayout";
import HomePage from "../../features/home/pages/HomePage";
import SignInPage from "../../features/auth/pages/SignInPage";
import ProductFormPage from "../../features/product/pages/ProductFormPage";
import MyPage from "../../features/my/pages/MyPage";
import KioskLoginPage from "../../features/kiosk/pages/KioskLoginPage";
import KioskHomePage from "../../features/kiosk/pages/KioskHomePage";

function RequireKioskAuth({ children }: { children: ReactNode }) {
  const kioskAccessToken = localStorage.getItem("kioskAccessToken");

  if (!kioskAccessToken) {
    return <Navigate to="/kiosk/login" replace />;
  }

  return children;
}

function BlockWebWhenKiosk({ children }: { children: ReactNode }) {
  const kioskAccessToken = localStorage.getItem("kioskAccessToken");

  if (kioskAccessToken) {
    return <Navigate to="/kiosk" replace />;
  }

  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <BlockWebWhenKiosk>
              <AppLayout />
            </BlockWebWhenKiosk>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/product/form" element={<ProductFormPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>

        <Route path="/signin" element={<SignInPage />} />

        <Route path="/kiosk/login" element={<KioskLoginPage />} />

        <Route
          path="/kiosk/*"
          element={
            <RequireKioskAuth>
              <KioskHomePage />
            </RequireKioskAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
