import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { mockNotifications } from "../../data/mock";
import type { AdminTab } from "./AdminSidebar";

interface AdminHeaderProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const tabLabels: Record<AdminTab, string> = {
  dashboard: "Panel",
  products: "Productos",
  inventory: "Inventario",
  orders: "Pedidos",
  customers: "Clientes",
  returns: "Devoluciones",
  metrics: "Metricas",
  settings: "Config.",
};

const tabDescriptions: Record<AdminTab, string> = {
  dashboard: "Resumen ejecutivo del sistema",
  products: "Gestion de productos y precios",
  inventory: "Control de stock e inventario",
  orders: "Seguimiento de pedidos y envios",
  customers: "Base de datos de clientes",
  returns: "Gestion de devoluciones",
  metrics: "Metricas de probador AR",
  settings: "Configuracion del sistema",
};

export default function AdminHeader({ activeTab, onTabChange }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = mockNotifications.length;

  return (
    <header className="bg-white border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="hover:text-slate-800 cursor-pointer">Panel de Control</span>
        <i className="fa-solid fa-chevron-right text-[10px] text-slate-400" />
        <span className="hover:text-slate-800 cursor-pointer">{tabLabels[activeTab]}</span>
        <i className="fa-solid fa-chevron-right text-[10px] text-slate-400" />
        <span className="text-slate-900 font-bold">{tabDescriptions[activeTab]}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block w-72">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="search"
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100/80 border border-transparent focus:border-brand-green focus:bg-white text-xs rounded-xl focus:outline-none transition-all"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <i className="fa-solid fa-bell text-sm" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-fade-in">
              <div className="flex justify-between items-center mb-3 pb-2 border-b">
                <h4 className="font-bold text-sm text-slate-800">Notificaciones</h4>
                <span className="text-[10px] font-semibold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                  {unreadCount} Nuevas
                </span>
              </div>
              <div className="space-y-3 text-xs">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                    onClick={() => {
                      onTabChange(n.targetTab as AdminTab);
                      setNotificationsOpen(false);
                    }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        n.type === "order" ? "bg-brand-green/10 text-brand-green" : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <i className={`fa-solid ${n.type === "order" ? "fa-cart-shopping" : "fa-triangle-exclamation"} text-xs`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <p className="text-slate-500 text-[11px]">{n.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover border border-brand-green" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center text-xs font-bold border border-brand-green/30">
              {(user?.name || user?.email || "A")[0].toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <span className="text-xs font-bold text-slate-800 block leading-tight">{user?.name || "Admin"}</span>
            <span className="text-[10px] text-brand-green font-extrabold uppercase">Admin</span>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-slate-100 ml-2"
            title="Cerrar"
          >
            <i className="fa-solid fa-right-from-bracket text-xs" />
          </button>
        </div>
      </div>
    </header>
  );
}
