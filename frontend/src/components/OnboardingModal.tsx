import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function OnboardingModal() {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [genero, setGenero] = useState(user?.genero || "");
  const [altura, setAltura] = useState(user?.altura ?? 170);
  const [pecho, setPecho] = useState(user?.medida_pecho ?? 90);
  const [cintura, setCintura] = useState(user?.medida_cintura ?? 80);
  const [cadera, setCadera] = useState(user?.medida_cadera ?? 90);
  const [muslo, setMuslo] = useState(user?.medida_muslo ?? 55);
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
        altura,
        medida_pecho: pecho,
        medida_cintura: cintura,
        medida_cadera: cadera,
        medida_muslo: muslo,
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
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-black dark:bg-[#E5FF00]' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase">¡Bienvenido a FitActive!</h2>
            <p className="text-slate-500 font-medium text-lg">Para recomendarte la mejor ropa y talla, necesitamos conocerte un poco. ¿Cuál es tu género y altura?</p>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide text-sm">Género</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGenero("Mujer")}
                  className={`py-4 rounded-xl font-bold border-2 transition-all ${genero === "Femenino" || genero === "Mujer" ? 'border-black bg-slate-50 dark:border-[#E5FF00] dark:bg-slate-800 dark:text-[#E5FF00]' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                >
                  Femenino
                </button>
                <button
                  onClick={() => setGenero("Hombre")}
                  className={`py-4 rounded-xl font-bold border-2 transition-all ${genero === "Masculino" || genero === "Hombre" ? 'border-black bg-slate-50 dark:border-[#E5FF00] dark:bg-slate-800 dark:text-[#E5FF00]' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                >
                  Masculino
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide text-sm flex justify-between">
                <span>Altura</span>
                <span className="text-black dark:text-[#E5FF00]">{altura} cm</span>
              </label>
              <input
                type="range" min="140" max="220"
                value={altura} onChange={e => setAltura(Number(e.target.value))}
                className="w-full accent-black dark:accent-[#E5FF00]"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!genero}
              className="w-full py-4 bg-black text-white dark:bg-[#E5FF00] dark:text-black font-black uppercase tracking-wide rounded-xl mt-8 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase">Tus Medidas</h2>
            <p className="text-slate-500 font-medium">Ajusta tus medidas base para el probador virtual (puedes editarlas luego).</p>

            {[{l: "Pecho", v: pecho, s: setPecho}, {l: "Cintura", v: cintura, s: setCintura}, {l: "Cadera", v: cadera, s: setCadera}, {l: "Muslo", v: muslo, s: setMuslo}].map((m) => (
              <div key={m.l}>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide text-xs flex justify-between">
                  <span>{m.l}</span>
                  <span className="text-black dark:text-[#E5FF00]">{m.v} cm</span>
                </label>
                <input
                  type="range" min="50" max="150"
                  value={m.v} onChange={e => m.s(Number(e.target.value))}
                  className="w-full accent-black dark:accent-[#E5FF00]"
                />
              </div>
            ))}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase tracking-wide rounded-xl"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 py-4 bg-black text-white dark:bg-[#E5FF00] dark:text-black font-black uppercase tracking-wide rounded-xl"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase">Tus Preferencias</h2>
            <p className="text-slate-500 font-medium">¿Qué tipo de ropa estás buscando en FitActive?</p>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide text-xs">Deporte / Actividad</label>
              <select
                value={deporte} onChange={e => setDeporte(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-[#E5FF00]"
              >
                <option value="">Seleccionar deporte...</option>
                <option value="Running">Running / Correr</option>
                <option value="Gym">Gym / Pesas</option>
                <option value="Yoga">Yoga / Pilates</option>
                <option value="Casual">Casual / Diario</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide text-xs">Tipo de Prendas</label>
              <select
                value={ropa} onChange={e => setRopa(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-[#E5FF00]"
              >
                <option value="">Seleccionar preferencia...</option>
                <option value="Oversize">Holgado / Oversize</option>
                <option value="Ajustado">Ajustado / Compresión</option>
                <option value="Regular">Regular / Estándar</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide text-xs">Colores Favoritos</label>
              <select
                value={colores} onChange={e => setColores(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-[#E5FF00]"
              >
                <option value="">Seleccionar color...</option>
                <option value="Oscuros">Tonos Oscuros (Negro, Gris, Azul marino)</option>
                <option value="Claros">Tonos Claros (Blanco, Beige, Pastel)</option>
                <option value="Vibrantes">Colores Vibrantes (Neón, Rojo, Amarillo)</option>
              </select>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase tracking-wide rounded-xl"
              >
                Atrás
              </button>
              <button
                onClick={handleFinish}
                disabled={saving || !deporte}
                className="w-2/3 py-4 bg-black text-white dark:bg-[#E5FF00] dark:text-black font-black uppercase tracking-wide rounded-xl disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {saving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                Finalizar
              </button>
            </div>
          </div>
        )}
        {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      </div>
    </div>
  );
}
