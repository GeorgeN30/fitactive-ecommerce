import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfilePreferencesFields, { type ProfilePreferences } from "./ProfilePreferencesFields";
import { profileSaveError } from "../utils/profileSaveError";

export default function OnboardingModal() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (user?.role !== "customer" || user.onboarding_completado !== false || pathname === "/perfil") return null;
  return <OnboardingForm key={user.id} />;
}

function OnboardingForm() {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const skipButton = useRef<HTMLButtonElement>(null);
  const [genero, setGenero] = useState<"Hombre" | "Mujer" | "">(
    user?.genero === "Femenino" || user?.genero === "Mujer" || user?.genero === "female"
      ? "Mujer"
      : user?.genero === "Masculino" || user?.genero === "Hombre" || user?.genero === "male"
        ? "Hombre" : ""
  );
  const [preferences, setPreferences] = useState<ProfilePreferences>({
    preferencia_deporte: user?.preferencia_deporte || "",
    preferencia_ropa: user?.preferencia_ropa || "",
    preferencia_colores: user?.preferencia_colores || "",
  });
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  async function handleFinish(skip = false) {
    setError("");
    setSaving(true);
    try {
      // Skipping must not save unfinished selections or overwrite existing preferences.
      await updateProfile(skip ? { onboarding_completado: true } : {
        genero: genero || undefined,
        ...preferences,
        onboarding_completado: true,
      });
    } catch (error) {
      setError(profileSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  // Keep fixed positioning independent of the animated route's transformed container.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        className="bg-white dark:bg-brand-card-dark w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl p-5 sm:p-8 shadow-2xl relative"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !saving) {
            event.preventDefault();
            void handleFinish(true);
          }
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), select:not(:disabled), a[href]"));
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (!first) { event.preventDefault(); return; }
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
          }
        }}
      >
        <div className="flex justify-end mb-3">
          <button ref={skipButton} type="button" disabled={saving} onClick={() => void handleFinish(true)}
            className="text-sm font-bold text-slate-600 dark:text-slate-300 underline underline-offset-4 hover:text-black dark:hover:text-brand-green disabled:opacity-50 cursor-pointer">
            Omitir por ahora
          </button>
        </div>
        <p id="onboarding-description" className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Puedes completar o cambiar tus preferencias después desde tu perfil.
        </p>
        <div className="flex gap-2 mb-6" aria-hidden="true">
          {[1, 2].map((value) => <div key={value} className={`h-2 flex-1 rounded-full ${value <= step ? "bg-black dark:bg-brand-green" : "bg-slate-200 dark:bg-slate-800"}`} />)}
        </div>
        <h2 id="onboarding-title" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase">
          {step === 1 ? "¡Bienvenido a FitActive!" : "Tus preferencias"}
        </h2>
        {step === 1 ? (
          <div className="space-y-6">
            <p className="text-slate-500 dark:text-slate-400">Selecciona tu sección principal para personalizar tu experiencia.</p>
            <div className="grid grid-cols-2 gap-4">
              {(["Mujer", "Hombre"] as const).map((value) => (
                <button key={value} type="button" aria-pressed={genero === value} onClick={() => setGenero(value)}
                  className={`py-4 rounded-2xl font-bold border-2 cursor-pointer ${genero === value ? "border-black bg-slate-50 dark:border-brand-green dark:bg-slate-800 dark:text-brand-green" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>
                  {value}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { setError(""); setStep(2); }} disabled={!genero || saving}
              className="w-full py-4 bg-black text-white dark:bg-brand-green dark:text-black font-black uppercase rounded-2xl disabled:opacity-50 cursor-pointer">
              Siguiente
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <ProfilePreferencesFields values={preferences} onChange={setPreferences} disabled={saving} />
            <div className="flex gap-4">
              <button type="button" onClick={() => { setError(""); setStep(1); }} disabled={saving}
                className="w-1/3 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase rounded-2xl disabled:opacity-50 cursor-pointer">
                Atrás
              </button>
              <button type="button" onClick={() => void handleFinish()} disabled={saving}
                className="w-2/3 py-4 bg-black text-white dark:bg-brand-green dark:text-black font-black uppercase rounded-2xl disabled:opacity-50 cursor-pointer">
                {saving ? "Guardando..." : "Finalizar"}
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 space-y-3">
            <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
            <Link to="/perfil" className="inline-block text-sm font-bold underline dark:text-white">
              Continuar desde mi perfil
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
