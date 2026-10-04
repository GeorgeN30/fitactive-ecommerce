import { useState, useEffect } from "react";
import ProfileLayout from "../components/ProfileLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [genero, setGenero] = useState(user?.genero || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  
  const [stats, setStats] = useState({
    pedidos: 0,
    favoritos: 0,
    total: "0.00"
  });

  useEffect(() => {
    Promise.all([
      api.get("/orders/my-orders").catch(() => ({ data: { orders: [] } })),
      api.get("/favorites").catch(() => ({ data: [] }))
    ]).then(([ordersRes, favsRes]) => {
      const orders = ordersRes.data.orders || [];
      const favs = favsRes.data || [];
      const total = orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
      setStats({
        pedidos: orders.length,
        favoritos: favs.length,
        total: total.toFixed(2)
      });
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (updateProfile) {
        await updateProfile({ 
          name: name.trim() || undefined,
          genero: genero || undefined
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
      <div className="bg-white dark:bg-brand-card-dark rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">Datos Personales</h2>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-2 bg-black text-white dark:bg-[#E5FF00] dark:text-black rounded-full font-black text-sm hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        {msg && (
          <div className="mb-6 p-4 bg-[#E5FF00]/20 text-black dark:text-[#E5FF00] rounded-xl font-bold flex items-center gap-3">
            <i className="fa-solid fa-check-circle"></i>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Nombre completo</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-green font-medium" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Correo electrónico</label>
            <input 
              type="text" 
              value={user?.email || ""} 
              disabled
              className="w-full bg-slate-100 dark:bg-slate-900 dark:border-slate-800 border border-slate-200 dark:text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed font-medium" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Género</label>
            <select 
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 dark:border-slate-700 border border-slate-200 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-green font-medium appearance-none"
            >
              <option value="">Selecciona tu género</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-700">
            <div className="text-3xl font-black mb-1 text-slate-900 dark:text-white">{stats.pedidos}</div>
            <div className="text-slate-500 font-bold text-sm uppercase tracking-wide">Pedidos</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-700">
            <div className="text-3xl font-black mb-1 text-slate-900 dark:text-white">{stats.favoritos}</div>
            <div className="text-slate-500 font-bold text-sm uppercase tracking-wide">Favoritos</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-700">
            <div className="text-3xl font-black mb-1 text-slate-900 dark:text-white">S/ {stats.total}</div>
            <div className="text-slate-500 font-bold text-sm uppercase tracking-wide">Total compras</div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
