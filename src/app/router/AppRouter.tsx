import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "../../layout/AppLayout";

import HomePage from "../../features/home/pages/HomePage";
import SignInPage from "../../features/auth/pages/SignInPage";
import ProductFormPage from "../../features/product/pages/ProductFormPage";
import ProductDetailPage from "../../features/product/pages/ProductDetailPage";
import MyPage from "../../features/my/pages/MyPage";

import KioskLoginPage from "../../features/kiosk/pages/KioskLoginPage";
import KioskHomePage from "../../features/kiosk/pages/KioskHomePage";
import KioskSellerDepositAuthPage from "../../features/kiosk/pages/KioskSellerDepositAuthPage";
import KioskSellerProductPage from "../../features/kiosk/pages/KioskSellerProductPage";
import KioskSellerDepositLockerAssignPage from "../../features/kiosk/pages/KioskSellerLockerAssignPage";
import KioskErrorPage from "../../features/kiosk/error/KioskErrorPage";

import KioskBuyerCheckAuthPage from "../../features/kiosk/pages/KioskBuyerCheckAuthPage";
import KioskBuyerCheckProductPage from "../../features/kiosk/pages/KioskBuyerCheckProductPage";
import KioskBuyerInspectionPage from "../../features/kiosk/pages/KioskBuyerInspectionPage";
import KioskBuyerPickupPage from "../../features/kiosk/pages/KioskBuyerPickupPage";

import ProductTradePage from "../../features/trade/pages/ProductTradePage";

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
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/trade/:tradeId" element={<ProductTradePage />} />
        </Route>

        <Route path="/signin" element={<SignInPage />} />
        <Route path="/m/login/:authCode" element={<SignInPage />} />

        <Route path="/kiosk/login" element={<KioskLoginPage />} />

        <Route
          path="/kiosk"
          element={
            <RequireKioskAuth>
              <KioskHomePage />
            </RequireKioskAuth>
          }
        />

        <Route
          path="/kiosk/error"
          element={
            <RequireKioskAuth>
              <KioskErrorPage />
            </RequireKioskAuth>
          }
        />

        <Route
          path="/kiosk/seller/deposit/auth"
          element={
            <RequireKioskAuth>
              <KioskSellerDepositAuthPage />
            </RequireKioskAuth>
          }
        />

        <Route
          path="/kiosk/seller/deposit/products/:authCode"
          element={
            <RequireKioskAuth>
              <KioskSellerProductPage />
            </RequireKioskAuth>
          }
        />

        <Route
          path="/kiosk/seller/deposit/locker/assign/:authCode"
          element={
            <RequireKioskAuth>
              <KioskSellerDepositLockerAssignPage />
            </RequireKioskAuth>
          }
        />

        <Route
          path="/kiosk/check"
          element={
            <RequireKioskAuth>
              <KioskBuyerCheckAuthPage />
            </RequireKioskAuth>
          }
        />

        <Route
          path="/kiosk/buyer/check/products/:authCode"
          element={
            <RequireKioskAuth>
              <KioskBuyerCheckProductPage />
            </RequireKioskAuth>
          }
        />

        <Route
          path="/kiosk/buyer/check/inspection/:authCode"
          element={
            <RequireKioskAuth>
              <KioskBuyerInspectionPage />
            </RequireKioskAuth>
          }
        />

        <Route
          path="/kiosk/pickup"
          element={
            <RequireKioskAuth>
              <KioskBuyerPickupPage />
            </RequireKioskAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
