import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfileSetupPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [genero, setGenero] = useState<"Hombre" | "Mujer">(
    user?.genero === "Femenino" || user?.genero === "Mujer"
      ? "Mujer"
      : "Hombre"
  );

  const [altura, setAltura] = useState(user?.altura ?? 170);

  const [medidas, setMedidas] = useState({
    pecho: user?.medida_pecho ?? 100,
    cintura: user?.medida_cintura ?? 85,
    cadera: user?.medida_cadera ?? 95,
    muslo: user?.medida_muslo ?? 55,
  });

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
    if (
      !Number.isFinite(altura) || altura < 100 || altura > 250 ||
      !Number.isFinite(medidas.pecho) || medidas.pecho < 30 || medidas.pecho > 250 ||
      !Number.isFinite(medidas.cintura) || medidas.cintura < 30 || medidas.cintura > 250 ||
      !Number.isFinite(medidas.cadera) || medidas.cadera < 30 || medidas.cadera > 250 ||
      !Number.isFinite(medidas.muslo) || medidas.muslo < 20 || medidas.muslo > 150
    ) {
      setError("Revisa que tus medidas estén dentro de los rangos indicados.");
      return;
    }

    try {
      setSaving(true);

      await updateProfile({
        genero,
        altura,
        medida_pecho: medidas.pecho,
        medida_cintura: medidas.cintura,
        medida_cadera: medidas.cadera,
        medida_muslo: medidas.muslo,
        onboarding_completado: true,
      });

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      setError("No se pudo guardar tu perfil. Inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-black text-center">
          Configura tu perfil
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Completa tus datos para personalizar tu experiencia en Fitlook.
        </p>

        <div className="mt-8 space-y-5">
          {/* Género */}
          <div>
            <label className="block font-semibold mb-2">
              Género
            </label>

            <select
              value={genero}
              onChange={(e) =>
                setGenero(e.target.value as "Hombre" | "Mujer")
              }
              className="w-full border rounded-lg px-4 py-3"
            >
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
            </select>
          </div>

          {/* Altura */}
          <div>
            <label className="block font-semibold mb-2">
              Altura (cm)
            </label>

            <input
              type="number"
              value={altura}
              onChange={(e) => setAltura(Number(e.target.value))}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Pecho */}
          <div>
            <label className="block font-semibold mb-2">
              Pecho (cm)
            </label>

            <input
              type="number"
              value={medidas.pecho}
              onChange={(e) =>
                setMedidas({
                  ...medidas,
                  pecho: Number(e.target.value),
                })
              }
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Cintura */}
          <div>
            <label className="block font-semibold mb-2">
              Cintura (cm)
            </label>

            <input
              type="number"
              value={medidas.cintura}
              onChange={(e) =>
                setMedidas({
                  ...medidas,
                  cintura: Number(e.target.value),
                })
              }
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Cadera */}
          <div>
            <label className="block font-semibold mb-2">
              Cadera (cm)
            </label>

            <input
              type="number"
              value={medidas.cadera}
              onChange={(e) =>
                setMedidas({
                  ...medidas,
                  cadera: Number(e.target.value),
                })
              }
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Muslo */}
          <div>
            <label className="block font-semibold mb-2">
              Muslo (cm)
            </label>

            <input
              type="number"
              value={medidas.muslo}
              onChange={(e) =>
                setMedidas({
                  ...medidas,
                  muslo: Number(e.target.value),
                })
              }
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-black text-white rounded-lg py-3 font-semibold disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar y continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
