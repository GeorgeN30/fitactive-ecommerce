import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStoreSettings } from "../context/StoreSettingsContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const settings = useStoreSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !(Array.isArray(requiredRole) ? requiredRole.includes(user.role) : user.role === requiredRole)) {
    return <Navigate to="/" replace />;
  }
  if (requiredRole && settings.twoFactor && !user.twoFactorEnabled) return <Navigate to="/2fa-setup" replace />;

  if (
    user.role === "customer" &&
    user.onboarding_completado === false &&
    location.pathname !== "/configurar-perfil"
  ) {
    return (
      <Navigate
        to="/configurar-perfil"
        replace
      />
    );
  }

  return <>{children}</>;
}
