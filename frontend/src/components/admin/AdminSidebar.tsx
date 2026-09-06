import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export type AdminTab =
  | "dashboard"
  | "products"
  | "inventory"
  | "orders"
  | "customers"
  | "returns"
  | "metrics"
  | "settings"
  | "notifications";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

const navItems: { key: AdminTab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "fa-solid fa-chart-line" },
  { key: "products", label: "Productos", icon: "fa-solid fa-box" },
  { key: "inventory", label: "Inventario", icon: "fa-solid fa-warehouse" },
  { key: "orders", label: "Pedidos", icon: "fa-solid fa-cart-shopping" },
  { key: "customers", label: "Clientes", icon: "fa-solid fa-users" },
  { key: "returns", label: "Devoluciones", icon: "fa-solid fa-rotate-left" },
  { key: "metrics", label: "Métricas", icon: "fa-solid fa-chart-bar" },
  { key: "notifications", label: "Notificaciones", icon: "fa-solid fa-bell" },
  { key: "settings", label: "Configuración", icon: "fa-solid fa-gear" },
];

export default function AdminSidebar({
  activeTab,
  onTabChange,
  mobileOpen = false,
  onClose = () => undefined,
}: AdminSidebarProps) {
  const { logout } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`${mobileOpen ? "fixed inset-y-0 left-0 z-50 flex" : "hidden lg:flex"} w-64 flex-col h-full flex-shrink-0 bg-[#0A0A0A] text-white`}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00E87A] rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-dumbbell text-[#0A0A0A] text-sm" />
            </div>
            <div>
              <div className="font-black text-base tracking-widest uppercase leading-none">
                FITLOOK
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onTabChange(item.key);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive
                    ? "bg-[#00E87A] text-[#0A0A0A] font-bold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <i
                  className={`${item.icon} w-5 h-5 ${isActive ? "text-[#0A0A0A]" : ""}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <i className="fa-solid fa-store w-4" />
            Vista tienda
          </Link>
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left"
          >
            <i className="fa-solid fa-right-from-bracket w-4" />
            Salir
          </button>
        </div>
      </aside>
    </>
  );
}
