import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import SuccessOverlay from "../components/SuccessOverlay";

type Step = "form" | "otp";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
      handleVerify(newCode.join(""));
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
      handleVerify(pasted);
    }
  }

  const navigateToSetup = useCallback(() => {
    navigate("/2fa-setup?firstTime=true", { replace: true });
  }, [navigate]);

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await fetch("/api/auth/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (data.error === "EMAIL_EXISTS") {
            setError("Este correo ya está registrado. Inicia sesión.");
          } else if (data.error === "INVALID_EMAIL") {
            setError("El correo electrónico no es válido.");
          } else {
            setError("No se pudo enviar el código. Intenta de nuevo.");
          }
          return;
        }
        setStep("otp");
        setCountdown(60);
      });
    } catch {
      setError("No se pudo enviar el código. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(codeStr?: string) {
    const fullCode = codeStr || code.join("");
    if (fullCode.length !== 6) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
          code: fullCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "INVALID_OTP") {
          setError("código inválido o expirado.");
          setCode(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        } else if (data.error === "EMAIL_EXISTS") {
          setError("Este correo ya está registrado. Inicia sesión.");
        } else {
          setError("No se pudo crear la cuenta. Intenta de nuevo.");
          setCode(["", "", "", "", "", ""]);
        }
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess(true);
    } catch {
      setError("No se pudo crear la cuenta. Intenta de nuevo.");
      setCode(["", "", "", "", "", ""]);
    } finally {
      setSending(false);
    }
  }

  async function handleResend() {
    setError("");
    try {
      await fetch("/api/auth/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      });
      setCountdown(60);
    } catch {
      setError("No se pudo reenviar el código.");
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
          message="Registro exitoso"
          subtitle="Configura tu armario virtual..."
          onDone={navigateToSetup}
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
          {step === "form" ? "Crear cuenta" : "Verifica tu correo"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-8">
          {step === "form"
            ? "Unete y obtiene un 30% de descuento en tu primer ajuste virtual."
            : `Ingresa el codigo de 6 digitos enviado a ${email}`}
        </p>

        {step === "form" && (
          <form
            onSubmit={handleFormSubmit}
            className="space-y-5 animate-slide-up-fade"
          >
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green focus:bg-white dark:focus:bg-slate-600 transition-all"
                placeholder="Ej. Carlos Fuentes"
              />
            </div>
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
                placeholder="ejemplo@correo.com"
              />
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
                  minLength={8}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 pr-10 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green focus:bg-white dark:focus:bg-slate-600 transition-all"
                  placeholder="Minimo 8 caracteres"
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

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5 text-brand-green focus:ring-brand-green accent-brand-green"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                  Acepto los{" "}
                  <a
                    href="#"
                    className="underline text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    Terminos de Servicio
                  </a>{" "}
                  y la{" "}
                  <a
                    href="#"
                    className="underline text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    Politica de Privacidad
                  </a>
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !agreed}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-green/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Enviando codigo..." : "Crear cuenta"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fullCode = code.join("");
              if (fullCode.length === 6) handleVerify(fullCode);
            }}
            className="space-y-5 animate-slide-up-fade"
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
                  className="w-12 h-14 text-center text-xl font-bold border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
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
              disabled={sending || code.some((c) => c === "")}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Verificando..." : "Verificar codigo"}
            </button>

            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No recibiste el código?{" "}
                {countdown > 0 ? (
                  <span className="text-slate-400 dark:text-slate-500">
                    Reenviar en {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-brand-green font-semibold hover:underline"
                  >
                    Reenviar codigo
                  </button>
                )}
              </p>
            </div>
          </form>
        )}

        {step === "form" && (
          <>
            <div className="relative my-6 flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
              <span className="bg-white dark:bg-brand-card-dark px-3 text-[11px] text-slate-400 font-medium absolute">
                o continuar con
              </span>
            </div>

            <button
              onClick={handleGoogleLogin}
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
          </>
        )}

        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          {step === "form" ? (
            <>
              Ya tienes una cuenta?{" "}
              <Link
                to="/login"
                className="text-brand-green font-bold hover:underline ml-1"
              >
                Inicia Sesion
              </Link>
            </>
          ) : (
            <button
              onClick={() => {
                setStep("form");
                setCode(["", "", "", "", "", ""]);
                setError("");
              }}
              className="text-brand-green font-bold hover:underline"
            >
              Cambiar correo
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
