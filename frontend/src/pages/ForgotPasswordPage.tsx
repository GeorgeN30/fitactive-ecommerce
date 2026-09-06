import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import AuthLayout from "../components/AuthLayout";

type Step = "email" | "otp" | "newPassword" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpRequired, setTotpRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [step]);

  function startCountdown() {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setStep("otp");
      startCountdown();
    } catch {
      setError("No se pudo enviar el codigo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        code: fullCode,
        newPassword,
        totpCode: totpRequired ? totpCode : undefined,
      });
      setStep("success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "RESET_FAILED";
      if (msg === "INVALID_OTP") {
        setError("Codigo invalido o expirado.");
        setCode(["", "", "", "", "", ""]);
      } else if (msg === "PASSWORD_TOO_SHORT") {
        setError("La contrasena debe tener minimo 8 caracteres.");
      } else if (msg === "TOTP_REQUIRED") {
        setTotpRequired(true);
        setError(
          "Esta cuenta tiene 2FA activo. Ingresa tambien el codigo TOTP.",
        );
      } else if (msg === "INVALID_TOTP") {
        setError("El codigo TOTP es incorrecto o ha expirado.");
        setTotpCode("");
      } else {
        setError("No se pudo restablecer la contrasena.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newCode.every((c) => c !== "")) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        setStep("newPassword");
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      setStep("newPassword");
    }
  }

  if (step === "success") {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <i className="fa-solid fa-check text-brand-green text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Contrasena actualizada
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Tu contrasena ha sido cambiada exitosamente.
          </p>
          <Link
            to="/login"
            className="inline-block w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm text-center"
          >
            Iniciar sesion
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <Link
          to="/login"
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors inline-flex items-center gap-1"
        >
          <i className="fa-solid fa-arrow-left" />
          Volver al login
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-key text-brand-green text-xl" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {step === "email"
            ? "Recuperar contrasena"
            : step === "otp"
              ? "Verifica tu correo"
              : totpRequired
                ? "Verifica tu identidad"
                : "Nueva contrasena"}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {step === "email"
            ? "Ingresa tu correo para recibir un codigo de verificacion"
            : step === "otp"
              ? `Ingresa el codigo enviado a ${email}`
              : totpRequired
                ? "Ingresa tambien el codigo TOTP de tu aplicacion autenticadora"
                : "Establece una nueva contrasena para tu cuenta"}
        </p>
      </div>

      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
              Correo Electronico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            disabled={loading}
            className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando..." : "Enviar codigo"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fullCode = code.join("");
            if (fullCode.length === 6) {
              setStep("newPassword");
            }
          }}
          className="space-y-5"
        >
          <div className="flex justify-center gap-2">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-xl font-bold border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all bg-slate-50 dark:bg-slate-700/50"
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={code.some((c) => c === "")}
            className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>

          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No recibiste el codigo?{" "}
              {countdown > 0 ? (
                <span className="text-slate-400 dark:text-slate-500">
                  Reenviar en {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setError("");
                    try {
                      await api.post("/auth/forgot-password", {
                        email: email.trim().toLowerCase(),
                      });
                      startCountdown();
                    } catch {
                      setError("No se pudo reenviar el codigo.");
                    }
                  }}
                  className="text-brand-green font-semibold hover:underline"
                >
                  Reenviar codigo
                </button>
              )}
            </p>
          </div>
        </form>
      )}

      {step === "newPassword" && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
              Nueva Contrasena
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 pr-10 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green focus:bg-white dark:focus:bg-slate-600 transition-all"
                placeholder="Minimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <i
                  className={`fa-regular ${
                    showPassword ? "fa-eye" : "fa-eye-slash"
                  } text-sm`}
                />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
              Confirmar Contrasena
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full bg-slate-50 dark:bg-slate-700/50 border rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-600 transition-all ${
                confirmPassword && newPassword !== confirmPassword
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 dark:border-slate-600 focus:border-brand-green"
              }`}
              placeholder="Repite tu contrasena"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                Las contrasenas no coinciden
              </p>
            )}
          </div>

          {totpRequired && (
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Codigo TOTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm tracking-[0.35em] text-slate-800 dark:text-white focus:outline-none focus:border-brand-green transition-all"
                placeholder="123456"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Usa el codigo actual de Google Authenticator, Authy u otra
                aplicacion compatible.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              newPassword.length < 8 ||
              newPassword !== confirmPassword ||
              (totpRequired && totpCode.length !== 6)
            }
            className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Guardando..." : "Restablecer contrasena"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
