import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function OnboardingModal() {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [genero, setGenero] = useState<"Hombre" | "Mujer" | "">(
    user?.genero === "Femenino" || user?.genero === "Mujer"
      ? "Mujer"
      : user?.genero === "Masculino" || user?.genero === "Hombre"
      ? "Hombre"
      : ""
  );
  const [ropa, setRopa] = useState(user?.preferencia_ropa || "");
  const [colores, setColores] = useState(user?.preferencia_colores || "");
  const [deporte, setDeporte] = useState(user?.preferencia_deporte || "");

  // Only show if user is logged in, NOT admin, and hasn't completed onboarding
  if (!user || user.role !== "customer" || user.onboarding_completado !== false) {
    return null;
  }

  async function handleFinish() {
    setError("");
    setSaving(true);
    try {
      await updateProfile({
        genero: genero || undefined,
        preferencia_ropa: ropa || undefined,
        preferencia_colores: colores || undefined,
        preferencia_deporte: deporte || undefined,
        onboarding_completado: true,
      });
    } catch {
      setError("No pudimos guardar tus datos. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-brand-card-dark w-full max-w-xl rounded-3xl p-8 shadow-2xl relative mt-10 md:mt-0">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? "bg-black dark:bg-[#E5FF00]" : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase">
              ¡Bienvenido a FitActive!
            </h2>
            <p className="text-slate-500 font-medium text-base">
              Personaliza tu experiencia de catálogo y probador virtual seleccionando tu preferencia deportiva.
            </p>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide text-xs">
                Sección Principal
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setGenero("Mujer")}
                  className={`py-4 rounded-2xl font-bold border-2 transition-all cursor-pointer ${
                    genero === "Mujer"
                      ? "border-black bg-slate-50 dark:border-[#E5FF00] dark:bg-slate-800 dark:text-[#E5FF00] shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                  }`}
                >
                  Mujer
                </button>
                <button
                  type="button"
                  onClick={() => setGenero("Hombre")}
                  className={`py-4 rounded-2xl font-bold border-2 transition-all cursor-pointer ${
                    genero === "Hombre"
                      ? "border-black bg-slate-50 dark:border-[#E5FF00] dark:bg-slate-800 dark:text-[#E5FF00] shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                  }`}
                >
                  Hombre
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!genero}
              className="w-full py-4 bg-black text-white dark:bg-[#E5FF00] dark:text-black font-black uppercase tracking-wide rounded-2xl mt-8 disabled:opacity-50 cursor-pointer shadow-md"
            >
              Siguiente
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase">
              Tus Preferencias
            </h2>
            <p className="text-slate-500 font-medium">
              ¿Qué tipo de indumentaria deportiva buscas en FitActive?
            </p>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide text-xs">
                Deporte / Disciplina
              </label>
              <select
                value={deporte}
                onChange={(e) => setDeporte(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-[#E5FF00]"
              >
                <option value="">Seleccionar disciplina...</option>
                <option value="Running">Running / Correr</option>
                <option value="Gym">Gym / Fitness / Crossfit</option>
                <option value="Yoga">Yoga / Pilates</option>
                <option value="Casual">Casual / Lifestyle</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide text-xs">
                Corte de Prenda Habitual
              </label>
              <select
                value={ropa}
                onChange={(e) => setRopa(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-[#E5FF00]"
              >
                <option value="">Seleccionar corte...</option>
                <option value="Regular">Regular Fit (Estándar)</option>
                <option value="Ajustado">Slim Fit (Compresión / Atlético)</option>
                <option value="Oversize">Oversize (Holgado)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide text-xs">
                Gama de Color Preferida
              </label>
              <select
                value={colores}
                onChange={(e) => setColores(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-[#E5FF00]"
              >
                <option value="">Seleccionar gama...</option>
                <option value="Oscuros">Tonos Oscuros (Negro, Azul marino, Grafito)</option>
                <option value="Claros">Tonos Claros (Blanco, Gris perla, Beige)</option>
                <option value="Vibrantes">Colores Deportivos (Rojo, Azul royal, Neón)</option>
              </select>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase tracking-wide rounded-2xl cursor-pointer"
              >
                Atrás
              </button>
              <button
                onClick={handleFinish}
                disabled={saving || !deporte}
                className="w-2/3 py-4 bg-black text-white dark:bg-[#E5FF00] dark:text-black font-black uppercase tracking-wide rounded-2xl disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer shadow-md"
              >
                {saving ? (
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-check"></i>
                )}
                Finalizar
              </button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-xs font-bold text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
