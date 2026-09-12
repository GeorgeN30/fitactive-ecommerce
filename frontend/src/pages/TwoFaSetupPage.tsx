import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AppLayout from "../components/AppLayout";

export default function TwoFaSetupPage() {
  const [searchParams] = useSearchParams();
  const isFirstTime = searchParams.get("firstTime") === "true";
  const { user, updateUser, refreshUser } = useAuth();
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  async function handleSetup() {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/2fa/setup");
      setQrSvg(data.qrSvg);
      setSecret(data.secret);
    } catch {
      setError("No se pudo generar el codigo QR.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/2fa/enable", { code });
      updateUser({ twoFactorEnabled: true });
      await refreshUser();
      setSuccess(true);
    } catch {
      setError("Codigo invalido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (success || user?.twoFactorEnabled) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white dark:bg-brand-card-dark rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-10 text-center">
            <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-check text-brand-green text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              2FA Activado
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              La autenticacion de doble factor esta habilitada en tu cuenta.
              Ahora se te pedira un codigo de 6 digitos al iniciar sesion.
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

  if (isFirstTime && !promptDismissed && !qrSvg) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white dark:bg-brand-card-dark rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 p-10 text-center">
            <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-shield-halved text-brand-green text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Protege tu cuenta
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
              La autenticacion de doble factor (2FA) agrega una capa extra de
              seguridad. Al activarla, al iniciar sesion se te pedira un codigo
              desde tu aplicacion de autenticacion.
            </p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleSetup}
                disabled={loading}
                className="bg-brand-green hover:bg-brand-green-hover text-slate-900 px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generando..." : "Configurar ahora"}
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
        {isFirstTime && (
          <button
            onClick={() => {
              setPromptDismissed(true);
              setQrSvg(null);
            }}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 mb-6 inline-flex items-center gap-1 transition-colors"
          >
            <i className="fa-solid fa-arrow-left" />
            Volver
          </button>
        )}

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
              <i className="fa-solid fa-shield-halved text-brand-green text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Configurar 2FA
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Protege tu cuenta con autenticacion de doble factor
            </p>
          </div>

          {!qrSvg ? (
            <div className="text-center">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-600">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Al activar 2FA, al iniciar sesion se te pedira un codigo de 6
                  digitos desde tu aplicacion de autenticacion (Google
                  Authenticator, Authy, etc.)
                </p>
              </div>
              <button
                onClick={handleSetup}
                disabled={loading}
                className="bg-brand-green hover:bg-brand-green-hover text-slate-900 px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generando..." : "Generar codigo QR"}
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                  Escanea este codigo con tu aplicacion de autenticacion
                </p>
                <div className="inline-block border border-slate-200 dark:border-slate-600 p-4 rounded-xl bg-white dark:bg-brand-card-dark">
                  <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
                </div>
                {secret && (
                  <div className="mt-4">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                      O ingresa este secreto manualmente:
                    </p>
                    <code className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg mt-1.5 inline-block break-all font-mono">
                      {secret}
                    </code>
                  </div>
                )}
              </div>

              <form onSubmit={handleEnable} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                    Codigo de verificacion
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setCode(val);
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
                  {loading ? "Verificando..." : "Activar 2FA"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
