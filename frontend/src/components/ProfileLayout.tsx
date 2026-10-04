import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "./AppLayout";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getMenuClass = (path: string) => {
    // Exact match or active sub-route
    const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      isActive
        ? "bg-brand-green/20 text-brand-green dark:bg-brand-green/10"
        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-brand-card-dark rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 text-center relative">
              <div className="relative inline-block mb-4">
                <img 
                  src={user?.picture || "https://ui-avatars.com/api/?name=" + (user?.name || "User")} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-brand-green/30"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{user?.name || "Usuario"}</h3>
              <p className="text-sm text-slate-500 mb-3">{user?.email}</p>
              <div className="inline-block bg-[#E5FF00] text-black text-xs font-bold px-3 py-1 rounded-full mb-6">
                Cliente Premium
              </div>

              <div className="flex flex-col text-left space-y-2 border-t border-slate-100 dark:border-slate-800 pt-6">
                <Link to="/perfil" className={getMenuClass("/perfil")}>
                  <i className="fa-solid fa-user w-5 text-center"></i> Mi perfil
                </Link>
                <Link to="/medidas" className={getMenuClass("/medidas")}>
                  <i className="fa-solid fa-ruler w-5 text-center"></i> Mis medidas
                </Link>
                <Link to="/mis-compras" className={getMenuClass("/mis-compras")}>
                  <i className="fa-solid fa-box w-5 text-center"></i> Pedidos
                </Link>
                <Link to="/favoritos" className={getMenuClass("/favoritos")}>
                  <i className="fa-solid fa-heart w-5 text-center"></i> Favoritos
                </Link>
                <Link to="/configuracion" className={getMenuClass("/configuracion")}>
                  <i className="fa-solid fa-gear w-5 text-center"></i> Configuración
                </Link>
                <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mt-4 transition-colors">
                  <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center"></i> Cerrar sesión
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
