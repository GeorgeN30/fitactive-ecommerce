import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import SuccessOverlay from "../components/SuccessOverlay";

export default function TwoFaVerifyPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { verify2Fa, preAuthUserId, clearPreAuth, user } = useAuth();
  const navigate = useNavigate();

  const navigateToHome = useCallback(() => {
    const role = user?.role;
    const path =
      role === "admin"
        ? "/admin"
        : role === "inventory" || role === "receptionist"
          ? "/inventory"
          : "/";
    navigate(path, { replace: true });
  }, [navigate, user]);

  useEffect(() => {
    if (!preAuthUserId && !user && !success) {
      navigate("/login", {
        replace: true,
        state: { authError: "No hay una verificación 2FA pendiente. Inicia sesión nuevamente." },
      });
    }
  }, [navigate, preAuthUserId, success, user]);

  if (!preAuthUserId && !user && !success) return null;

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verify2Fa(code);
      setSuccess(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const apiError = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      if (status === 401 || (err instanceof Error && err.message === "NO_PREAUTH_SESSION")) {
        clearPreAuth();
        navigate("/login", {
          replace: true,
          state: {
            authError: apiError === "ACCOUNT_BLOCKED"
              ? "Esta cuenta está bloqueada. Contacta al administrador."
              : apiError === "MFA_REQUIRED"
                ? "El token enviado no corresponde a una verificación 2FA. Inicia sesión nuevamente."
                : "El desafío de verificación expiró o no es válido. Inicia sesión nuevamente.",
          },
        });
        return;
      }
      setError(
        apiError === "TOTP_NOT_SETUP"
          ? "La verificación 2FA de esta cuenta necesita configurarse de nuevo."
          : "El código es inválido o expiró. Revisa la hora automática de tu dispositivo e intenta de nuevo.",
      );
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {success && (
        <SuccessOverlay
          message="Verificacion completada"
          subtitle="Acceso concedido"
          onDone={navigateToHome}
        />
      )}
      <div className="text-center mb-8 animate-slide-up-fade">
        <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-shield-halved text-brand-green text-xl" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Verificación de doble factor
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ingresa el código de 6 dígitos de tu aplicación de autenticación
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
            código de verificación
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(val);
              setError("");
            }}
            required
            maxLength={6}
            pattern="[0-9]{6}"
            className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-center text-xl tracking-[0.5em] font-bold text-slate-800 dark:text-white focus:outline-none focus:border-brand-green focus:bg-white dark:focus:bg-slate-600 transition-all"
            placeholder="000000"
            autoFocus
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verificando..." : "Verificar"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            clearPreAuth();
            navigate("/login", { replace: true });
          }}
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors inline-flex items-center gap-1"
        >
          <i className="fa-solid fa-arrow-left" />
          Volver al inicio de sesión
        </button>
      </div>
    </AuthLayout>
  );
}
