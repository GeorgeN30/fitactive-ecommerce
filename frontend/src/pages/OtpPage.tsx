import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AuthLayout from "../components/AuthLayout";
import SuccessOverlay from "../components/SuccessOverlay";

interface LocationState {
  email?: string;
  name?: string;
}

export default function OtpPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState<{
    message: string;
    subtitle: string;
    target: string;
  } | null>(null);
  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const email = state?.email as string;
  const name = state?.name;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const navigateToTarget = useCallback(() => {
    if (success) navigate(success.target, { replace: true });
  }, [success, navigate]);

  if (!email) return null;

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newCode.every((c) => c !== "") && newCode.join("").length === 6) {
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

  async function handleVerify(codeStr?: string) {
    const fullCode = codeStr || code.join("");
    if (fullCode.length !== 6) return;
    setError("");
    setVerifying(true);
    try {
      const requires2Fa = await loginWithOtp(email, fullCode, name);
      if (requires2Fa) {
        setSuccess({
          message: "Sesion iniciada",
          subtitle: "Redirigiendo a verificacion de seguridad...",
          target: "/2fa-verify",
        });
      } else {
        setSuccess({
          message: "Sesion iniciada",
          subtitle: "Bienvenido de vuelta",
          target: "/",
        });
      }
    } catch {
      setError("Codigo invalido o expirado. Intenta de nuevo.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setError("");
    setResending(true);
    try {
      await api.post("/auth/otp-request", { email, name });
      setCountdown(60);
    } catch {
      setError("No se pudo reenviar el codigo.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout>
      {success && (
        <SuccessOverlay
          message={success.message}
          subtitle={success.subtitle}
          onDone={navigateToTarget}
        />
      )}
      <div className="text-center mb-8 animate-slide-up-fade">
        <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-envelope text-brand-green text-xl" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Verifica tu correo
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ingresa el codigo de 6 digitos enviado a
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
          {email}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify();
        }}
      >
        <div className="flex justify-center gap-2 mb-6">
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
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-xl font-bold border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all bg-slate-50 dark:bg-slate-700/50"
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-lg mb-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={verifying || code.some((c) => c === "")}
          className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 dark:text-brand-card-dark font-bold py-3.5 rounded-xl transition-all shadow-md shadow-brand-green/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? "Verificando..." : "Verificar codigo"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No recibiste el codigo?{" "}
          {countdown > 0 ? (
            <span className="text-slate-400 dark:text-slate-500">
              Reenviar en {countdown}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-brand-green font-semibold hover:underline disabled:opacity-50"
            >
              {resending ? "Reenviando..." : "Reenviar codigo"}
            </button>
          )}
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link
          to="/login"
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <i className="fa-solid fa-arrow-left mr-1" />
          Cambiar correo
        </Link>
      </div>
    </AuthLayout>
  );
}
