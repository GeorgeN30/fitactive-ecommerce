import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AppLayout from "../components/AppLayout";

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const isFirstTime = searchParams.get("firstTime") === "true";
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  useEffect(() => {
    if (!isFirstTime) return;
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (data.user.hasPassword) {
          navigate("/", { replace: true });
        }
      })
      .catch(() => {});
  }, [isFirstTime, navigate]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/set-password", { newPassword });
      await refreshUser();
      setSuccess(true);
    } catch {
      setError("No se pudo configurar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white dark:bg-brand-card-dark rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-10 text-center">
            <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-check text-brand-green text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Contraseña configurada
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Ahora puedes iniciar sesión con Google o con tu correo y
              contraseña.
            </p>
            <a
              href="/"
              className="inline-block bg-brand-green hover:bg-brand-green-hover text-slate-900 px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-green/20"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isFirstTime && !promptDismissed) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white dark:bg-brand-card-dark rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-10 text-center">
            <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-key text-brand-green text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Agrega una contraseña
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
              Configura una contraseña para poder iniciar sesión con tu correo
              electrónico además de Google.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setPromptDismissed(true)}
                className="bg-brand-green hover:bg-brand-green-hover text-slate-900 px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-green/20"
              >
                Configurar ahora
              </button>
              <a
                href="/"
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium py-2"
              >
                Ahora no, continuar
              </a>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-12">
        {!isFirstTime && (
          <a
            href="/"
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 mb-6 inline-flex items-center gap-1 transition-colors"
          >
            <i className="fa-solid fa-arrow-left" />
            Volver al inicio
          </a>
        )}

        <div className="bg-white dark:bg-brand-card-dark rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-key text-brand-green text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Establecer contraseña
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Crea una contraseña para tu cuenta
            </p>
          </div>

          <form onSubmit={handleSetPassword} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 pr-10 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green transition-all"
                  placeholder="Minimo 8 caracteres"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <i
                    className={`fa-regular ${showPw ? "fa-eye" : "fa-eye-slash"} text-sm`}
                  />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Confirmar contraseña
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green transition-all"
                placeholder="Repite la contraseña"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Establecer contraseña"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
