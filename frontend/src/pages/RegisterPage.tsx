import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import SuccessOverlay from "../components/SuccessOverlay";
import api from "../services/api";

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

  // Estados para los modales legales
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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

    if (!agreed) {
      setError("Es obligatorio aceptar los Términos de Servicio y la Política de Privacidad para crear una cuenta.");
      return;
    }

    setError("");
    setSending(true);
    try {
      await api.post("/auth/register-request", {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim() || undefined,
      });
      setStep("otp");
      setCountdown(60);
    } catch (err: any) {
      const errorData = err.response?.data?.error;
      if (errorData === "EMAIL_EXISTS") {
        setError("Este correo ya está registrado en el sistema. Por favor, inicia sesión.");
      } else if (errorData === "INVALID_EMAIL") {
        setError("El formato del correo electrónico ingresado no es válido.");
      } else {
        setError("Error de comunicación con el servidor. Inténtalo nuevamente.");
      }
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
      const response = await api.post("/auth/register", {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim() || undefined,
        code: fullCode,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setSuccess(true);
    } catch (err: any) {
      const errorData = err.response?.data?.error;
      if (errorData === "INVALID_OTP") {
        setError("El código de verificación es inválido o ha expirado.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else if (errorData === "EMAIL_EXISTS") {
        setError("Este correo ya ha sido registrado durante el proceso. Inicia sesión.");
      } else {
        setError("Excepción interna al crear la cuenta. Inténtalo más tarde.");
        setCode(["", "", "", "", "", ""]);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleResend() {
    setError("");
    try {
      await api.post("/auth/register-request", {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim() || undefined,
      });
      setCountdown(60);
    } catch {
      setError("Fallo al contactar al servidor para reenviar el código OTP.");
    }
  }

  function handleGoogleLogin() {
    if (!clientId) {
      setError("El proveedor de identidad OAuth2 (Google) no está configurado en el entorno actual.");
      return;
    }
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${window.location.origin}/google-callback&response_type=token&scope=openid email profile`;
  }

  return (
    <AuthLayout>
      {success && (
        <SuccessOverlay
          message="Registro completado"
          subtitle="Inicializando entorno virtual..."
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
          {step === "form" ? "Crear cuenta corporativa" : "Autenticación OTP"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-8">
          {step === "form"
            ? "Regístrate para acceder al motor de evaluación biométrica."
            : `Ingresa el token de seguridad de 6 dígitos enviado a ${email}`}
        </p>

        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-5 animate-slide-up-fade">
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green focus:bg-white dark:focus:bg-slate-600 transition-all"
                placeholder="Ingresa tus nombres y apellidos"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green focus:bg-white dark:focus:bg-slate-600 transition-all"
                placeholder="ejemplo@dominio.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Contraseña de Acceso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 pr-10 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green focus:bg-white dark:focus:bg-slate-600 transition-all"
                  placeholder="Mínimo 8 caracteres alfanuméricos"
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

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    required
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (e.target.checked) setError("");
                    }}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded cursor-pointer checked:bg-brand-green checked:border-brand-green transition-all"
                  />
                  <i className="fa-solid fa-check absolute text-slate-900 text-xs opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200"></i>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Declaro que he leído, comprendido y acepto íntegramente los{" "}
                  <button type="button" onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="underline decoration-brand-green/50 text-slate-700 dark:text-slate-200 hover:text-brand-green dark:hover:text-brand-green font-bold cursor-pointer transition-colors">
                    Términos de Servicio
                  </button>{" "}
                  y la{" "}
                  <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }} className="underline decoration-brand-green/50 text-slate-700 dark:text-slate-200 hover:text-brand-green dark:hover:text-brand-green font-bold cursor-pointer transition-colors">
                    Política de Privacidad
                  </button>
                  {" "}establecidos por FITLOOK.
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-xl font-medium flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !agreed}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-extrabold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none uppercase tracking-wide mt-2"
            >
              {sending ? "Procesando solicitud de registro..." : "Crear cuenta"}
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
            className="space-y-6 animate-slide-up-fade"
          >
            <div className="flex justify-center gap-2 sm:gap-3">
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
                  className="w-10 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-xl font-medium flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || code.some((c) => c === "")}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-slate-900 font-extrabold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none uppercase tracking-wide"
            >
              {sending ? "Validando token..." : "Verificar e Ingresar"}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ¿No recibiste el token de acceso?{" "}
                {countdown > 0 ? (
                  <span className="text-slate-400 dark:text-slate-500 font-bold">Inténtalo de nuevo en {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-brand-green font-bold hover:underline cursor-pointer"
                  >
                    Solicitar nuevo código
                  </button>
                )}
              </p>
            </div>
          </form>
        )}

        {step === "form" && (
          <>
            <div className="relative my-7 flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
              <span className="bg-white dark:bg-brand-card-dark px-4 text-[10px] text-slate-400 font-bold tracking-widest uppercase absolute">
                Integración de Terceros
              </span>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-xl py-3.5 text-xs font-bold transition-all bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-white"
            >
              <i className="fa-brands fa-google text-sm" />
              Continuar con Google Workspace
            </button>
          </>
        )}

        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          {step === "form" ? (
            <>
              ¿Ya posees credenciales de acceso?{" "}
              <Link
                to="/login"
                className="text-brand-green font-bold hover:underline ml-1"
              >
                Acceder a la plataforma
              </Link>
            </>
          ) : (
            <button
              onClick={() => {
                setStep("form");
                setCode(["", "", "", "", "", ""]);
                setError("");
              }}
              className="text-brand-green font-bold hover:underline cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i> Modificar correo electrónico
            </button>
          )}
        </div>
      </div>

      {/* MODAL LEGAL: TÉRMINOS Y CONDICIONES (VERSIÓN EXTENDIDA EMPRESARIAL) */}
      {showTerms && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-slide-up-fade">
          <div className="bg-white dark:bg-[#111318] rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0a0b0e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shadow-inner">
                  <i className="fa-solid fa-scale-balanced text-brand-green text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">Términos y Condiciones de Servicio</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Última actualización: Septiembre de 2026</p>
                </div>
              </div>
              <button onClick={() => setShowTerms(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar text-xs md:text-sm text-slate-600 dark:text-slate-400 space-y-6 leading-relaxed">
              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">1. Naturaleza Jurídica y Aceptación</h4>
                <p>El presente documento constituye un contrato legalmente vinculante entre usted (en adelante, el "Usuario") y <strong>FITLOOK Athletics</strong> (en adelante, "La Empresa"). Al completar el registro, acceder a la plataforma web o hacer uso de nuestra tecnología de evaluación biométrica ("Smart Fit 2D"), el Usuario declara ser mayor de edad legal en su jurisdicción y acepta incondicionalmente todos los términos descritos en este documento.</p>
              </article>

              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">2. Especificaciones de la Tecnología "Smart Fit 2D"</h4>
                <p>La Empresa pone a disposición del Usuario un algoritmo de recomendación de tallas basado en los parámetros antropométricos suministrados manualmente por el Usuario. Es de vital importancia reconocer que:</p>
                <ul className="list-disc pl-5 mt-3 space-y-2 marker:text-brand-green">
                  <li>El sistema proporciona sugerencias estadísticas (Fit Map) y no garantiza una precisión absoluta.</li>
                  <li>Las medidas y tolerancias del tejido final de las prendas pueden variar ligeramente respecto a la base de datos algorítmica por factores de manufactura.</li>
                  <li>La Empresa no se hace responsable por insatisfacción derivada de un ajuste inexacto si el Usuario proporcionó mediciones erróneas o desactualizadas en su perfil.</li>
                </ul>
              </article>

              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">3. Derechos de Propiedad Intelectual e Industrial</h4>
                <p>La plataforma, su código fuente, bases de datos subyacentes, algoritmos de cálculo, diseño de interfaces (UI/UX), marcas comerciales registradas y materiales audiovisuales son propiedad exclusiva de La Empresa. Se otorga al Usuario una licencia limitada, revocable, no exclusiva y no transferible para uso estrictamente personal. Queda rigurosamente prohibida la ingeniería inversa, extracción de datos (web scraping) o copia del funcionamiento del motor Smart Fit 2D.</p>
              </article>

              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">4. Política de Transacciones y Reembolsos</h4>
                <p>Los precios publicados en el catálogo están sujetos a variaciones sin previo aviso. FITLOOK otorga un periodo de treinta (30) días calendario para procesar devoluciones o cambios por inconformidad de talla. El producto debe retornar en condiciones originales, con etiquetas intactas y sin señales de uso para que el reembolso sea procedente.</p>
              </article>

              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">5. Limitación de Responsabilidad Legal</h4>
                <p className="uppercase text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-500 mt-2">
                  En la máxima medida permitida por la ley aplicable, FITLOOK Athletics, sus directores, empleados o proveedores tecnológicos no serán responsables por daños indirectos, punitivos, incidentales, especiales o emergentes, incluyendo pérdida de beneficios o datos, que resulten del uso o la imposibilidad de uso del servicio. La plataforma se proporciona "tal cual" (As is) y "según disponibilidad".
                </p>
              </article>

              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">6. Legislación Aplicable y Resolución de Disputas</h4>
                <p>La validez, ejecución e interpretación de los presentes Términos se regirán por las leyes de la <strong>República del Perú</strong>. Cualquier controversia, reclamación o disputa legal que surja de estos Términos o del uso de la plataforma será sometida a la jurisdicción exclusiva de los tribunales competentes de la ciudad de Lima, Perú, renunciando expresamente a cualquier otro fuero que pudiera corresponder.</p>
              </article>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0b0e] flex justify-end gap-3">
              <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-2">
                <i className="fa-solid fa-print"></i> Imprimir Copia
              </button>
              <button onClick={() => setShowTerms(false)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-8 py-2.5 rounded-xl hover:opacity-90 transition-all text-xs uppercase tracking-wide cursor-pointer shadow-lg">
                Cerrar documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LEGAL: POLÍTICA DE PRIVACIDAD (VERSIÓN EXTENDIDA EMPRESARIAL) */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-slide-up-fade">
          <div className="bg-white dark:bg-[#111318] rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0a0b0e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shadow-inner">
                  <i className="fa-solid fa-user-shield text-brand-green text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">Política de Privacidad y Tratamiento de Datos</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Acorde a la Ley de Protección de Datos Personales (Ley N° 29733)</p>
                </div>
              </div>
              <button onClick={() => setShowPrivacy(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar text-xs md:text-sm text-slate-600 dark:text-slate-400 space-y-6 leading-relaxed">
              <div className="bg-brand-green/10 border border-brand-green/30 p-4 rounded-xl text-brand-green-hover dark:text-brand-green mb-6 text-xs font-medium">
                <i className="fa-solid fa-lock mr-2"></i> FITLOOK Athletics respeta profundamente tu privacidad. Nunca venderemos, alquilaremos ni comercializaremos tu perfil físico biométrico ni tu historial de compras a terceros.
              </div>

              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">1. Recopilación de Datos Sensibles (Biométricos/Antropométricos)</h4>
                <p>Para proveer la funcionalidad principal de la plataforma, recopilamos información física explícita proveída por el Usuario, tales como:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-brand-green">
                  <li>Medidas exactas en centímetros (Contorno de pecho, cintura y cadera).</li>
                  <li>Datos de registro estándar: Nombre completo y correo electrónico verificado.</li>
                  <li>Metadatos de sesión (Dirección IP, tokens de acceso temporal y cookies esenciales).</li>
                </ul>
              </article>

              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">2. Almacenamiento, Nube y Proveedores (Subencargados)</h4>
                <p>Para asegurar la continuidad del servicio y la máxima seguridad de la información, tus datos son alojados en ecosistemas de computación en la nube de nivel empresarial. Utilizamos infraestructura provista por <strong>Google Cloud Platform (GCP)</strong> y bases de datos gestionadas a través de <strong>Supabase</strong>. Estos proveedores cumplen con estrictas normativas ISO de seguridad, pero no tienen derecho legal a visualizar ni procesar tus datos antropométricos para sus propios fines.</p>
              </article>

              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">3. Protocolos de Cifrado y Seguridad (Zero-Trust)</h4>
                <p>Las contraseñas no se almacenan bajo ninguna circunstancia en texto plano. Empleamos algoritmos criptográficos robustos de hash unilateral. Adicionalmente, implementamos cifrado SSL/TLS en tránsito y arquitecturas de autenticación multifactor (2FA) para blindar el acceso a tu armario virtual y perfil biométrico.</p>
              </article>

              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">4. Periodo de Retención de la Información</h4>
                <p>Tus datos personales y registros físicos permanecerán almacenados en nuestra base de datos únicamente mientras tu cuenta permanezca activa. Si solicitas el cierre definitivo de tu cuenta, ejecutaremos un protocolo de purga (Hard Delete) en nuestros servidores, destruyendo tu información biométrica y credenciales en un plazo no mayor a 72 horas hábiles.</p>
              </article>

              <article>
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-[11px] border-l-2 border-brand-green pl-3">5. Ejercicio de Derechos ARCO</h4>
                <p>De conformidad con la Ley N° 29733 (Ley de Protección de Datos Personales de la República del Perú) y su Reglamento, el Usuario tiene pleno derecho a:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-brand-green">
                  <li><strong>A</strong>cceso: Conocer exactamente qué datos poseemos sobre usted.</li>
                  <li><strong>R</strong>ectificación: Modificar o actualizar sus medidas corporales en el panel de usuario.</li>
                  <li><strong>C</strong>ancelación: Exigir la supresión total de su cuenta y huella biométrica digital.</li>
                  <li><strong>O</strong>posición: Restringir el uso de su correo electrónico para campañas de marketing.</li>
                </ul>
              </article>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0b0e] flex justify-end gap-3">
              <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-2">
                <i className="fa-solid fa-print"></i> Imprimir Copia
              </button>
              <button onClick={() => setShowPrivacy(false)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-8 py-2.5 rounded-xl hover:opacity-90 transition-all text-xs uppercase tracking-wide cursor-pointer shadow-lg">
                Cerrar documento
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}