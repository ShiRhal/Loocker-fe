import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../../layout/AppLayout";
import HomePage from "../../features/home/pages/HomePage";
import SignInPage from "../../features/auth/pages/SignInPage";
import ProductFormPage from "../../features/product/pages/ProductFormPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ NavBar 필요한 페이지들 */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/form" element={<ProductFormPage />} />
        </Route>

        {/* ✅ NavBar 없는 페이지 */}
        <Route path="/signin" element={<SignInPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
