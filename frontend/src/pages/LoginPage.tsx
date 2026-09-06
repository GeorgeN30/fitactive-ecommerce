import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import api from "../services/api";
import SuccessOverlay from "../components/SuccessOverlay";

type Step = "email" | "password" | "otp";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { loginWithPassword, user } = useAuth();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (step === "email") {
      setError("");
      setPassword("");
    }
    if (step === "password") setError("");
    if (step === "otp") setError("");
  }, [step]);

  const navigateToHome = useCallback(() => {
    const role = user?.role;
    const path =
      role === "admin"
        ? "/admin"
        : role === "inventory" || role === "receptionist"
          ? "/inventory"
          : "/";
    window.location.href = path;
  }, [user]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const { data } = await api.get(
        `/auth/check-password?email=${encodeURIComponent(email.trim().toLowerCase())}`,
      );
      if (!data.exists) {
        setError("Correo no registrado. Crea una cuenta para continuar.");
        return;
      }
      if (data.hasPassword) {
        setStep("password");
      } else {
        await api.post("/auth/otp-request", {
          email: email.trim().toLowerCase(),
        });
        navigate("/otp", { state: { email: email.trim().toLowerCase() } });
      }
    } catch {
      setError("No se pudo verificar el correo. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const requires2Fa = await loginWithPassword(
        email.trim().toLowerCase(),
        password,
      );
      if (requires2Fa) {
        navigate("/2fa-verify");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setSending(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await api.post("/auth/otp-request", {
        email: email.trim().toLowerCase(),
      });
      navigate("/otp", { state: { email: email.trim().toLowerCase() } });
    } catch {
      setError("No se pudo enviar el código. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  function handleGoogleLogin() {
    if (!clientId) {
      setError("Google no está configurado en este entorno.");
      return;
    }
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${window.location.origin}/google-callback&response_type=token&scope=openid email profile`;
  }

  return (
    <AuthLayout>
      {success && (
        <SuccessOverlay
          message="Sesion iniciada"
          subtitle="Bienvenido de vuelta"
          onDone={navigateToHome}
        />
      )}
      <div className="bg-white dark:bg-brand-card-dark rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-8 sm:p-10 animate-slide-up-fade">
        <Link to="/" className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            FIT<span className="text-brand-green">LOOK</span>
          </span>
          <span className="bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-brand-green px-2 py-0.5 rounded border border-brand-green/30 tracking-wider">
            AR FIT
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-8"
        >
          <i className="fa-solid fa-arrow-left text-[10px]" />
          Volver al inicio
        </Link>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Iniciar sesion
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-8">
          Ingresa tu correo para acceder a tu cuenta.
        </p>

        {step === "email" && (
          <form
            onSubmit={handleEmailSubmit}
            className="space-y-5 animate-slide-up-fade"
          >
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Correo Electronico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green focus:bg-white dark:focus:bg-slate-600 transition-all"
                placeholder="tu@email.com"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Verificando..." : "Continuar"}
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
              <span className="bg-white dark:bg-brand-card-dark px-3 text-[11px] text-slate-400 font-medium absolute">
                o continuar con
              </span>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={!clientId}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold transition-all ${
                clientId
                  ? "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-white"
                  : "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-400 cursor-not-allowed"
              }`}
            >
              <i className="fa-brands fa-google text-sm" />
              Google
            </button>
          </form>
        )}

        {step === "password" && (
          <form
            onSubmit={handlePasswordSubmit}
            className="space-y-5 animate-slide-up-fade"
          >
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Correo Electronico
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-800 dark:text-white truncate flex-1">
                  {email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setPassword("");
                    setError("");
                  }}
                  className="text-xs text-brand-green font-semibold hover:underline shrink-0"
                >
                  Cambiar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Contrasena
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 pr-10 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green focus:bg-white dark:focus:bg-slate-600 transition-all"
                  placeholder="Tu contrasena"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <i
                    className={`fa-regular ${
                      showPassword ? "fa-eye" : "fa-eye-slash"
                    } text-sm`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-brand-green focus:ring-brand-green accent-brand-green"
                />
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Recordarme
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline font-medium"
              >
                Olvidé mi contraseña
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Ingresando..." : "Iniciar sesión"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setPassword("");
                handleOtpSubmit(
                  new Event("submit") as unknown as React.FormEvent,
                );
              }}
              className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium"
            >
              Usar código OTP en su lugar
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          No tienes cuenta?{" "}
          <Link
            to="/register"
            className="text-brand-green font-bold hover:underline ml-1"
          >
            Regístrate
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
