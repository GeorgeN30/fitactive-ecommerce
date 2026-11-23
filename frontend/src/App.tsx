import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { StoreSettingsProvider } from "./context/StoreSettingsContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import HomePage from "./pages/HomePage";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import LegacyAdminRedirect from "./components/admin/LegacyAdminRedirect";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const OtpPage = lazy(() => import("./pages/OtpPage"));
const GoogleCallbackPage = lazy(() => import("./pages/GoogleCallbackPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const TwoFaSetupPage = lazy(() => import("./pages/TwoFaSetupPage"));
const TwoFaVerifyPage = lazy(() => import("./pages/TwoFaVerifyPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const SetPasswordPage = lazy(() => import("./pages/SetPasswordPage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const InformationPage = lazy(() => import("./pages/InformationPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
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
    <div key={location.pathname} className="animate-route-fade-in">
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
              <Navigate to="/perfil" replace />
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
        <Route path="/admin/products" element={<ProtectedRoute requiredRole="admin"><Navigate replace to="/admin" /></ProtectedRoute>} />
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
