import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { StoreSettingsProvider } from "./context/StoreSettingsContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OtpPage from "./pages/OtpPage";
import GoogleCallbackPage from "./pages/GoogleCallbackPage";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import TwoFaSetupPage from "./pages/TwoFaSetupPage";
import TwoFaVerifyPage from "./pages/TwoFaVerifyPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import SetPasswordPage from "./pages/SetPasswordPage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import { CartProvider } from "./context/CartContext";
import CartPage from "./pages/CartPage";
import NotificationsPage from "./pages/NotificationsPage";
import { FavoritesProvider } from "./context/FavoritesContext";
import FavoritesPage from "./pages/FavoritesPage";
import InformationPage from "./pages/InformationPage";
import ContactPage from "./pages/ContactPage";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import NotFoundPage from "./pages/NotFoundPage";
import LegacyAdminRedirect from "./components/admin/LegacyAdminRedirect";

import ProfilePage from "./pages/ProfilePage";
import ProfileSetupPage from "./pages/ProfileSetupPage";

const ProbadorVirtual = lazy(() => import("./pages/ProbadorVirtual"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const InventoryDashboard = lazy(() => import("./pages/inventory/InventoryDashboard"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.key} className="animate-route-fade-in">
      <RouteErrorBoundary>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-500">Cargando…</div>}>
      <Routes location={location}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/google-callback" element={<GoogleCallbackPage />} />
        <Route path="/2fa-setup" element={<TwoFaSetupPage />} />
        <Route path="/2fa-verify" element={<TwoFaVerifyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />

        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/soporte/contacto" element={<ContactPage />} />
        <Route path="/soporte/:slug" element={<InformationPage />} />
        <Route path="/legal/:slug" element={<InformationPage />} />
        <Route path="/producto/:id" element={<ProductDetailPage />} />
        <Route path="/probador-virtual" element={<ProbadorVirtual />} />

        <Route
          path="/configurar-perfil"
          element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/favoritos" element={<FavoritesPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/result" element={<PaymentResultPage />} />
        <Route
          path="/mis-compras"
          element={
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-compras/:id"
          element={
            <ProtectedRoute>
              <OrderTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notificaciones"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/products" element={<ProtectedRoute requiredRole="admin"><LegacyAdminRedirect section="products" /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute requiredRole="admin"><LegacyAdminRedirect section="orders" /></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute requiredRole="admin"><LegacyAdminRedirect section="clients" /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute requiredRole="admin"><LegacyAdminRedirect section="notifications" /></ProtectedRoute>} />
        <Route path="/admin/returns" element={<ProtectedRoute requiredRole="admin"><LegacyAdminRedirect section="returns" /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><LegacyAdminRedirect section="config" /></ProtectedRoute>} />
        <Route path="/admin/inventory" element={<ProtectedRoute requiredRole="admin"><InventoryDashboard /></ProtectedRoute>} />

        <Route
          path="/recepcion"
          element={
          <ProtectedRoute requiredRole={["inventory", "admin"]}>
              <InventoryDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
          <ProtectedRoute requiredRole={["inventory", "admin"]}>
              <InventoryDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/configuracion"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      </RouteErrorBoundary>
    </div>
  );
}

import { ThemeProvider } from "next-themes";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <StoreSettingsProvider><AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <ScrollToTop />
              <AnimatedRoutes />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider></StoreSettingsProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
