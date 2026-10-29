import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export default function ProfileSetupPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [genero, setGenero] = useState<"Hombre" | "Mujer">(
    user?.genero === "Femenino" || user?.genero === "Mujer" ? "Mujer" : "Hombre"
  );
  const [tallaHabitual, setTallaHabitual] = useState<string>("M");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.onboarding_completado) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  async function handleSave() {
    setError("");
    if (!user) return;

    try {
      setSaving(true);
      await updateProfile({
        genero,
        preferencia_ropa: `Talla ${tallaHabitual}`,
        onboarding_completado: true,
      });

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Error al guardar el perfil:", err);
      setError("No se pudo guardar tu perfil. Inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-6 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-white/10">
        <h1 className="text-2xl sm:text-3xl font-black text-center text-gray-900 dark:text-white uppercase tracking-tight">
          Configura tu perfil
        </h1>

        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          Personaliza tu catálogo y probador virtual con tus preferencias deportivas básicas.
        </p>

        <div className="mt-8 space-y-6">
          {/* Género */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              Sección Preferida
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["Hombre", "Mujer"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenero(g)}
                  className={`py-3.5 rounded-2xl text-xs font-black border-2 transition-all cursor-pointer ${
                    genero === g
                      ? "border-brand-green bg-brand-green/10 text-brand-green shadow-sm"
                      : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Talla Estándar Habitual */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              Talla Deportiva Habitual
            </label>
            <div className="grid grid-cols-6 gap-2">
              {STANDARD_SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setTallaHabitual(sz)}
                  className={`py-3 rounded-xl text-xs font-black transition-all cursor-pointer text-center ${
                    tallaHabitual === sz
                      ? "bg-brand-green text-black ring-2 ring-brand-green/80 shadow-md scale-105"
                      : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600 font-bold">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-brand-green text-black font-black uppercase tracking-wider text-xs rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Guardando perfil…" : "Guardar y comenzar"}
          </button>
        </div>
      </div>
    </div>
  );
}
