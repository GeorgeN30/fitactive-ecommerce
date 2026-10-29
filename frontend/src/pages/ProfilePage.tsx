import { useState, useEffect } from "react";
import ProfileLayout from "../components/ProfileLayout";
import { useAuth } from "../context/AuthContext";
import { fetchMyOrders } from "../services/orders";
import { useFavorites } from "../context/FavoritesContext";
import { fetchMyTryOnHistory, type UserTryOnHistoryItem } from "../services/virtualTryOn";
import { formatSoles } from "../utils/money";

function profileGender(value?: string | null) {
  const normalized = value?.toLowerCase();
  return ["female", "mujer", "femenino"].includes(normalized || "")
    ? "Femenino"
    : ["male", "hombre", "masculino"].includes(normalized || "")
      ? "Masculino"
      : "";
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const favoritesCtx = useFavorites();
  const favorites = favoritesCtx?.favorites || [];
  const removeFavorite = favoritesCtx?.removeFavorite;

  const [name, setName] = useState(user?.name || "");
  const [genero, setGenero] = useState(profileGender(user?.genero));
  const [tipoCuerpo, setTipoCuerpo] = useState("medio");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [statsError, setStatsError] = useState("");

  const [stats, setStats] = useState({
    pedidos: 0,
    favoritos: 0,
    total: "0.00",
  });

  const [tryOnHistory, setTryOnHistory] = useState<UserTryOnHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const savedType = localStorage.getItem(
      `fitlook_tipo_cuerpo_${user.id}`
    );

    if (savedType && ["delgado", "medio", "ancho"].includes(savedType)) {
      setTipoCuerpo(savedType);
    } else {
      setTipoCuerpo("medio");
    }
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    void fetchMyOrders()
      .then((orders) => {
        if (cancelled) return;
        const total = orders
          .filter((order) => ["confirmed", "preparing", "shipped", "delivered"].includes(order.estado.toLowerCase()))
          .reduce((sum, order) => sum + order.total - (order.refundedAmount || 0), 0);
        setStats({ pedidos: orders.length, favoritos: favorites.length, total: total.toFixed(2) });
      })
      .catch(() => {
        if (!cancelled) setStatsError("No se pudieron consultar las estadísticas de tus compras.");
      });
    return () => {
      cancelled = true;
    };
  }, [favorites.length]);

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    void fetchMyTryOnHistory()
      .then((items) => {
        if (!cancelled) {
          setTryOnHistory(items || []);
        }
      })
      .catch(() => {
        if (!cancelled) setTryOnHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setMsg("Ingresa un nombre de al menos 2 caracteres.");
      return;
    }
    setSaving(true);
    try {
      localStorage.setItem(
        `fitlook_tipo_cuerpo_${user?.id ?? "anonimo"}`,
        tipoCuerpo
      );
      if (updateProfile) {
        await updateProfile({
          name: name.trim() || undefined,
          genero: genero || undefined,
        });
      }
      setMsg("Perfil guardado con éxito");
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("Error al guardar perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProfileLayout>
      <div className="space-y-8">
        {/* Panel de Datos Personales */}
        <div className="bg-white dark:bg-brand-card-dark rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
              Datos Personales
            </h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-black text-white dark:bg-brand-green dark:text-black rounded-full font-black text-sm hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>

          {msg && (
            <div className="mb-6 p-4 bg-brand-green/20 text-black dark:text-brand-green rounded-xl font-bold flex items-center gap-3">
              <i className="fa-solid fa-check-circle"></i>
              {msg}
            </div>
          )}


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide"
              >
                Nombre completo
              </label>
              <input
                type="text"
                id="profile-name"
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-green font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                type="text"
                value={user?.email || ""}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-900 dark:border-slate-800 border border-slate-200 dark:text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="profile-gender"
                className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide"
              >
                Género
              </label>
              <select
                id="profile-gender"
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-green font-medium"
              >
                <option value="">Selecciona tu género</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="profile-body-type"
                className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide"
              >
                Tipo de cuerpo
              </label>
              <select
                id="profile-body-type"
                value={tipoCuerpo}
                onChange={(e) => setTipoCuerpo(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-green font-medium"
              >
                <option value="delgado">Delgado</option>
                <option value="medio">Medio / Proporcionado</option>
                <option value="ancho">Ancho / Robusto</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Este perfil se utilizará para adaptar tu avatar en el probador 3D.
              </p>
            </div>
          </div>

          {statsError && <p role="alert" className="text-red-600 mb-4">{statsError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/mis-compras"
              className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-700 hover:border-brand-green transition-colors"
            >
              <div className="text-3xl font-black mb-1 text-slate-900 dark:text-white">
                {statsError ? "-" : stats.pedidos}
              </div>
              <div className="text-slate-500 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-1.5">
                <i className="fa-solid fa-box text-xs"></i> Pedidos
              </div>
            </a>
            <a
              href="/favoritos"
              className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-700 hover:border-brand-green transition-colors"
            >
              <div className="text-3xl font-black mb-1 text-brand-green">
                {favorites.length}
              </div>
              <div className="text-slate-500 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-1.5">
                <i className="fa-solid fa-heart text-xs text-red-500"></i> Favoritos
              </div>
            </a>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-700">
              <div className="text-3xl font-black mb-1 text-slate-900 dark:text-white">
                {statsError ? "-" : `S/ ${stats.total}`}
              </div>
              <div className="text-slate-500 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-1.5">
                <i className="fa-solid fa-bag-shopping text-xs"></i> Total compras
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Mis Prendas Favoritas en el Perfil (HU-010) */}
        <div className="bg-white dark:bg-brand-card-dark rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-heart text-red-500 text-lg"></i>
                <span>Prendas Favoritas Guardadas</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Prendas deportivas vinculadas a tu cuenta de usuario
              </p>
            </div>
            <a
              href="/favoritos"
              className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
            >
              <span>Ver catálogo de favoritos</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </a>
          </div>

          {favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-red-500 flex items-center justify-center text-xl mx-auto mb-3">
                <i className="fa-regular fa-heart"></i>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Aún no tienes prendas en tus favoritos.</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Explora el catálogo o el probador 3D y pulsa el corazón para guardarlas en tu perfil.</p>
              <a
                href="/catalogo"
                className="inline-flex px-5 py-2.5 bg-brand-green text-black font-extrabold rounded-xl text-xs hover:opacity-90 transition"
              >
                Explorar catálogo
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {favorites.slice(0, 4).map((fav) => (
                <div
                  key={fav.id}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between group"
                >
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white dark:bg-black/20 mb-3 p-2">
                    <img
                      src={fav.img || "https://placehold.co/400x500"}
                      alt={fav.name || "Prenda"}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => removeFavorite?.(fav.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-zinc-800 text-red-500 flex items-center justify-center shadow-sm hover:scale-110 transition cursor-pointer"
                      title="Quitar de favoritos"
                    >
                      <i className="fa-solid fa-heart text-xs"></i>
                    </button>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{fav.cat || "Deporte"}</span>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 mb-1">{fav.name || "Prenda Deportiva"}</h3>
                    <div className="text-xs font-black text-slate-900 dark:text-brand-green mb-3">
                      {typeof fav.price === "number" && fav.price > 0 ? formatSoles(fav.price) : "Consultar precio"}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href={`/probador-virtual?producto=${fav.id}`}
                        className="py-1.5 px-2 bg-brand-green text-black rounded-lg text-[10px] font-black uppercase text-center hover:opacity-90 transition"
                      >
                        Probar 3D
                      </a>
                      <a
                        href={`/producto/${fav.id}`}
                        className="py-1.5 px-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold text-center hover:bg-slate-300 transition"
                      >
                        Detalle
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección: Historial de Pruebas Virtuales (HU-009) */}
        <div className="bg-white dark:bg-brand-card-dark rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-shirt text-brand-green text-lg"></i>
                <span>Historial de Pruebas en Avatar 3D</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Registro de prendas y tallas evaluadas (HU-009)
              </p>
            </div>
            <a
              href="/probador-virtual"
              className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
            >
              <span>Abrir Probador</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </a>
          </div>

          {loadingHistory ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <i className="fa-solid fa-circle-notch fa-spin text-lg mb-2"></i>
              <p>Consultando historial de pruebas...</p>
            </div>
          ) : tryOnHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-brand-green flex items-center justify-center text-xl mx-auto mb-3">
                <i className="fa-solid fa-vest"></i>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No hay pruebas virtuales registradas todavía.</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Prueba cómo te quedan las prendas deportivas en el avatar 3D y se guardarán automáticamente aquí.</p>
              <a
                href="/probador-virtual"
                className="inline-flex px-5 py-2.5 bg-brand-green text-black font-extrabold rounded-xl text-xs hover:opacity-90 transition"
              >
                Ir al Probador 3D
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase tracking-wider text-[10px] text-slate-400">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Prenda</th>
                    <th className="py-3 px-4">Talla</th>
                    <th className="py-3 px-4">Compatibilidad</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tryOnHistory.slice(0, 8).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.productos?.imagen_url ? (
                            <img
                              src={item.productos.imagen_url}
                              alt={item.productos.nombre}
                              className="w-10 h-10 object-contain rounded-lg bg-white dark:bg-black/20 p-1 border border-slate-100 dark:border-slate-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                              <i className="fa-solid fa-shirt text-xs"></i>
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {item.productos?.nombre || "Prenda Deportiva"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {item.productos?.categoria || item.genero}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-brand-green/10 text-brand-green font-black text-[10px]">
                          {item.talla || "M"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {item.compatibilidad ? (
                          <span className="text-emerald-600 dark:text-brand-green font-bold flex items-center gap-1">
                            <i className="fa-solid fa-check text-[10px]"></i>
                            <span>{item.compatibilidad}% entalle</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Óptimo</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(item.creado_en).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`/probador-virtual?producto=${item.producto_id || ""}&talla=${item.talla || "M"}`}
                          className="px-3 py-1.5 bg-black text-white dark:bg-brand-green dark:text-black rounded-lg font-bold text-[10px] uppercase hover:opacity-90 transition inline-block"
                        >
                          Reintentar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
}
