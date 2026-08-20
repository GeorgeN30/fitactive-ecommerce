import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "danger">("profile");

  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");

  const [hasPassword, setHasPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  const [setPwValue, setSetPwValue] = useState("");
  const [confirmSetPw, setConfirmSetPw] = useState("");
  const [showSetPw, setShowSetPw] = useState(false);
  const [savingSetPw, setSavingSetPw] = useState(false);
  const [setPwMsgVal, setSetPwMsgVal] = useState("");
  const [setPwErrorVal, setSetPwErrorVal] = useState("");

  const [deletePw, setDeletePw] = useState("");
  const [deleteTotp, setDeleteTotp] = useState("");
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    api.get("/auth/me").then(({ data }) => {
      setHasPassword(data.user.hasPassword);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");
    setSavingProfile(true);
    try {
      updateUser({ name: name.trim() || undefined });
      setProfileMsg("Perfil actualizado.");
    } catch {
      setProfileError("No se pudo actualizar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("Las contrasenas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    setSavingPw(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setPwMsg("Contrasena actualizada.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg === "INVALID_CURRENT_PASSWORD") {
        setPwError("La contrasena actual es incorrecta.");
      } else if (msg === "PASSWORD_TOO_SHORT") {
        setPwError("La contrasena debe tener al menos 8 caracteres.");
      } else {
        setPwError("No se pudo cambiar la contrasena.");
      }
    } finally {
      setSavingPw(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setSetPwMsgVal("");
    setSetPwErrorVal("");
    if (setPwValue !== confirmSetPw) {
      setSetPwErrorVal("Las contrasenas no coinciden.");
      return;
    }
    if (setPwValue.length < 8) {
      setSetPwErrorVal("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    setSavingSetPw(true);
    try {
      await api.post("/auth/set-password", { newPassword: setPwValue });
      setHasPassword(true);
      setSetPwMsgVal("Contrasena configurada.");
      setSetPwValue("");
      setConfirmSetPw("");
    } catch {
      setSetPwErrorVal("No se pudo configurar la contrasena.");
    } finally {
      setSavingSetPw(false);
    }
  }

  async function handleRequestDeleteOtp(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError("");
    if (!confirmDelete) return;
    setSendingOtp(true);
    try {
      await api.post("/auth/request-delete-otp", {
        password: hasPassword ? deletePw : undefined,
        totpCode: user?.twoFactorEnabled ? deleteTotp : undefined,
      });
      setDeleteStep("otp");
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg === "INVALID_PASSWORD") {
        setDeleteError("La contrasena es incorrecta.");
      } else if (msg === "INVALID_TOTP") {
        setDeleteError("El codigo TOTP es incorrecto.");
      } else if (msg === "PASSWORD_REQUIRED") {
        setDeleteError("Debes ingresar tu contrasena.");
      } else if (msg === "TOTP_REQUIRED") {
        setDeleteError("Debes ingresar el codigo TOTP.");
      } else {
        setDeleteError("No se pudo enviar el codigo. Intenta de nuevo.");
      }
    } finally {
      setSendingOtp(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    setDeleteError("");
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newCode.every((c) => c !== "")) {
      handleVerifyDeleteOtp(newCode.join(""));
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setOtpCode(newCode);
      otpRefs.current[5]?.focus();
      handleVerifyDeleteOtp(pasted);
    }
  }

  async function handleVerifyDeleteOtp(codeStr?: string) {
    const fullCode = codeStr || otpCode.join("");
    if (fullCode.length !== 6) return;
    setDeleteError("");
    setVerifyingOtp(true);
    try {
      await api.post("/auth/verify-delete-otp", { code: fullCode });
      logout();
      window.location.href = "/login";
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg === "INVALID_OTP") {
        setDeleteError("Codigo invalido o expirado.");
        setOtpCode(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else {
        setDeleteError("No se pudo verificar el codigo.");
        setOtpCode(["", "", "", "", "", ""]);
      }
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleResendDeleteOtp() {
    setDeleteError("");
    try {
      await api.post("/auth/request-delete-otp", {
        password: hasPassword ? deletePw : undefined,
        totpCode: user?.twoFactorEnabled ? deleteTotp : undefined,
      });
      setCountdown(60);
    } catch {
      setDeleteError("No se pudo reenviar el codigo.");
    }
  }

  const tabs = [
    { key: "profile" as const, label: "Perfil", icon: "fa-user" },
    { key: "security" as const, label: "Seguridad", icon: "fa-shield-halved" },
    { key: "danger" as const, label: "Zona de peligro", icon: "fa-triangle-exclamation" },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Configuracion</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra tu perfil y seguridad de la cuenta.
          </p>
        </div>

        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-8 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-brand-green text-brand-green"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <i className={`fa-solid ${t.icon} mr-2 text-xs`} />
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 dark:bg-brand-card-dark dark:border-slate-600 p-6 sm:p-8 space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Datos personales</h3>
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Correo Electronico
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                El correo no se puede cambiar.
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green focus:bg-white dark:focus:bg-slate-700/50 transition-all"
                placeholder="Tu nombre"
              />
            </div>

            {profileMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-2.5 rounded-lg dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-300">
                {profileMsg}
              </div>
            )}
            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-lg dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-300">
                {profileError}
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {savingProfile ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 dark:bg-brand-card-dark dark:border-slate-600 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                <i className="fa-solid fa-shield-halved mr-2 text-brand-green" />
                Autenticacion de dos factores
              </h3>
              {user?.twoFactorEnabled ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">2FA activo</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tu cuenta tiene una capa extra de seguridad.
                    </p>
                  </div>
                  <Link
                    to="/2fa-setup"
                    className="text-xs font-semibold text-brand-green hover:underline"
                  >
                    Configurar
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">2FA no configurado</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Activa la autenticacion de dos factores para mayor seguridad.
                    </p>
                  </div>
                  <Link
                    to="/2fa-setup"
                    className="bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold px-4 py-2 rounded-lg text-xs transition-all"
                  >
                    Activar 2FA
                  </Link>
                </div>
              )}
            </div>

            {!hasPassword && (
              <form onSubmit={handleSetPassword} className="bg-white rounded-2xl border border-slate-200 dark:bg-brand-card-dark dark:border-slate-600 p-6 sm:p-8 space-y-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  <i className="fa-solid fa-key mr-2 text-brand-green" />
                  Establecer contrasena
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tu cuenta fue creada con Google. Configura una contrasena para poder
                  iniciar sesion con correo y contrasena.
                </p>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                    Nueva contrasena
                  </label>
                  <div className="relative">
                    <input
                      type={showSetPw ? "text" : "password"}
                      value={setPwValue}
                      onChange={(e) => setSetPwValue(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 pr-10 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green transition-all"
                      placeholder="Minimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetPw(!showSetPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <i className={`fa-regular ${showSetPw ? "fa-eye" : "fa-eye-slash"} text-sm`} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                    Confirmar contrasena
                  </label>
                  <input
                    type={showSetPw ? "text" : "password"}
                    value={confirmSetPw}
                    onChange={(e) => setConfirmSetPw(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green transition-all"
                    placeholder="Repite la contrasena"
                  />
                </div>

                {setPwMsgVal && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-2.5 rounded-lg dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-300">
                    {setPwMsgVal}
                  </div>
                )}
                {setPwErrorVal && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-lg dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-300">
                    {setPwErrorVal}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingSetPw}
                  className="bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  {savingSetPw ? "Guardando..." : "Establecer contrasena"}
                </button>
              </form>
            )}

            {hasPassword && (
              <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200 dark:bg-brand-card-dark dark:border-slate-600 p-6 sm:p-8 space-y-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  <i className="fa-solid fa-key mr-2 text-brand-green" />
                  Cambiar contrasena
                </h3>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                    Contrasena actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 pr-10 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green transition-all"
                      placeholder="Tu contrasena actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <i className={`fa-regular ${showCurrentPw ? "fa-eye" : "fa-eye-slash"} text-sm`} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                    Nueva contrasena
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 pr-10 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green transition-all"
                      placeholder="Minimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <i className={`fa-regular ${showNewPw ? "fa-eye" : "fa-eye-slash"} text-sm`} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                    Confirmar nueva contrasena
                  </label>
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-brand-green transition-all"
                    placeholder="Repite la contrasena"
                  />
                </div>

                {pwMsg && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-2.5 rounded-lg dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-300">
                    {pwMsg}
                  </div>
                )}
                {pwError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-lg dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-300">
                    {pwError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPw}
                  className="bg-brand-green hover:bg-brand-green-hover text-slate-900 font-bold px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  {savingPw ? "Guardando..." : "Cambiar contrasena"}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === "danger" && (
          <div className="bg-white rounded-2xl border-2 border-red-200 dark:bg-brand-card-dark dark:border-red-800/50 p-6 sm:p-8 space-y-5">
            {deleteStep === "form" ? (
              <form onSubmit={handleRequestDeleteOtp}>
                <h3 className="text-lg font-bold text-red-600">
                  <i className="fa-solid fa-triangle-exclamation mr-2" />
                  Eliminar cuenta
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
                  Esta accion es <strong>permanente</strong> y no se puede deshacer.
                  Se eliminaran todos tus datos, incluyendo tu perfil, pedidos y
                  medidas AR.
                </p>

                <div className="mt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-xs px-4 py-2.5 rounded-lg">
                    Se enviara un codigo de verificacion a <strong>{user?.email}</strong> para confirmar la eliminacion.
                  </div>
                </div>

                {!hasPassword && (
                  <div className="mt-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-xs px-4 py-2.5 rounded-lg">
                    Tu cuenta fue creada con Google. No necesitas contrasena para eliminarla.
                  </div>
                )}

                {hasPassword && (
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                      Contrasena
                    </label>
                    <div className="relative">
                      <input
                        type={showDeletePw ? "text" : "password"}
                        value={deletePw}
                        onChange={(e) => setDeletePw(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 pr-10 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-red-400 transition-all"
                        placeholder="Tu contrasena"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePw(!showDeletePw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <i className={`fa-regular ${showDeletePw ? "fa-eye" : "fa-eye-slash"} text-sm`} />
                      </button>
                    </div>
                  </div>
                )}

                {user?.twoFactorEnabled && (
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2">
                      Codigo TOTP (2FA)
                    </label>
                    <input
                      type="text"
                      value={deleteTotp}
                      onChange={(e) => setDeleteTotp(e.target.value)}
                      maxLength={6}
                      className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-red-400 transition-all tracking-[0.3em] font-mono"
                      placeholder="000000"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.checked)}
                      className="w-4 h-4 rounded mt-0.5 text-red-600 focus:ring-red-500 accent-red-600"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                      Confirmo que deseo eliminar mi cuenta de forma permanente y
                      entiendo que esta accion no se puede deshacer.
                    </span>
                  </label>
                </div>

                {deleteError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-lg dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-300 mt-4">
                    {deleteError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!confirmDelete || sendingOtp}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-4"
                >
                  {sendingOtp ? "Enviando codigo..." : "Enviar codigo de verificacion"}
                </button>
              </form>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-red-600">
                  <i className="fa-solid fa-shield-halved mr-2" />
                  Verifica tu identidad
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
                  Ingresa el codigo de 6 digitos enviado a <strong>{user?.email}</strong> para
                  confirmar la eliminacion de tu cuenta.
                </p>

                <div className="flex justify-center gap-2 mt-6">
                  {otpCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-14 text-center text-xl font-bold border border-red-200 dark:border-red-800/50 rounded-xl focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                    />
                  ))}
                </div>

                {deleteError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-lg dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-300 mt-4">
                    {deleteError}
                  </div>
                )}

                <button
                  onClick={() => handleVerifyDeleteOtp()}
                  disabled={verifyingOtp || otpCode.some((c) => c === "")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {verifyingOtp ? "Verificando..." : "Eliminar mi cuenta permanentemente"}
                </button>

                <div className="text-center mt-4">
                  {countdown > 0 ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Reenviar en {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendDeleteOtp}
                      className="text-xs text-brand-green font-semibold hover:underline"
                    >
                      Reenviar codigo
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteStep("form");
                    setOtpCode(["", "", "", "", "", ""]);
                    setDeleteError("");
                  }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium py-3 mt-2"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
