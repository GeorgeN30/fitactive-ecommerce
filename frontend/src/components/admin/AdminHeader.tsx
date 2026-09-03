import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { mockNotifications } from "../../data/mock";
import type { AdminTab } from "./AdminSidebar";

interface AdminHeaderProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onOpenSidebar: () => void;
}

const tabLabels: Record<AdminTab, string> = {
  dashboard: "Dashboard",
  products: "Productos",
  inventory: "Inventario",
  orders: "Pedidos",
  customers: "Clientes",
  returns: "Devoluciones",
  metrics: "Métricas",
  notifications: "Notificaciones",
  settings: "Configuración",
};

const tabSubtitles: Record<AdminTab, string> = {
  dashboard: "Panel de administración · FITLOOK",
  products: "Gestión de productos · FITLOOK",
  inventory: "Control de stock · FITLOOK",
  orders: "Seguimiento de pedidos · FITLOOK",
  customers: "Base de datos de clientes · FITLOOK",
  returns: "Gestión de devoluciones · FITLOOK",
  metrics: "Métricas del probador AR · FITLOOK",
  notifications: "Alertas y actividades · FITLOOK",
  settings: "Configuración del sistema · FITLOOK",
};

export default function AdminHeader({ activeTab, onTabChange, onOpenSidebar }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = mockNotifications.length;

  return (
    <header className="relative bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 flex-shrink-0">
      <button
        onClick={onOpenSidebar}
        aria-label="Abrir menú"
        className="lg:hidden text-gray-500 hover:text-gray-900 transition-colors"
      >
        <i className="fa-solid fa-bars text-lg" />
      </button>
      <div className="flex-1">
        <h2 className="font-bold text-gray-900">{tabLabels[activeTab]}</h2>
        <p className="text-xs text-gray-400">{tabSubtitles[activeTab]}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          aria-label="Notificaciones"
          className="relative text-gray-500 hover:text-gray-900 transition-colors"
        >
          <i className="fa-solid fa-bell text-lg" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00E87A] text-[#0A0A0A] text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {notificationsOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-fade-in">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h4 className="font-bold text-sm text-gray-900">Notificaciones</h4>
              <span className="text-[10px] font-semibold text-[#00E87A] bg-[#00E87A]/10 px-2 py-0.5 rounded-full">
                {unreadCount} Nuevas
              </span>
            </div>
            <div className="space-y-3 text-xs">
              {mockNotifications.map((n) => (
                <div
                  key={n.id}
                  className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => {
                    onTabChange(n.targetTab as AdminTab);
                    setNotificationsOpen(false);
                  }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      n.type === "order" ? "bg-[#00E87A]/10 text-[#00E87A]" : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    <i className={`fa-solid ${n.type === "order" ? "fa-cart-shopping" : "fa-triangle-exclamation"} text-xs`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{n.title}</p>
                    <p className="text-gray-500 text-[11px]">{n.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#00E87A]/10 text-[#00E87A] flex items-center justify-center text-xs font-bold">
              {(user?.name || user?.email || "A")[0].toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <span className="text-xs font-bold text-gray-900 block leading-tight">{user?.name || "Admin"}</span>
            <span className="text-[10px] text-[#00E87A] font-extrabold uppercase">Admin</span>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg ml-1"
            title="Cerrar"
          >
            <i className="fa-solid fa-right-from-bracket text-xs" />
          </button>
        </div>
      </div>
    </header>
  );
}
