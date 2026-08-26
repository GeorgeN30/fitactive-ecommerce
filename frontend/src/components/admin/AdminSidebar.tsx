import { Link } from "react-router-dom";

export type AdminTab = "dashboard" | "products" | "inventory" | "orders" | "customers" | "returns" | "metrics" | "settings";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const navItems: { key: AdminTab; label: string; description: string; icon: string }[] = [
  { key: "dashboard", label: "Panel", description: "Vista general", icon: "fa-solid fa-chart-line" },
  { key: "products", label: "Productos", description: "Productos", icon: "fa-solid fa-box" },
  { key: "inventory", label: "Inventario", description: "Inventario", icon: "fa-solid fa-warehouse" },
  { key: "orders", label: "Pedidos", description: "Pedidos", icon: "fa-solid fa-cart-shopping" },
  { key: "customers", label: "Clientes", description: "Clientes", icon: "fa-solid fa-users" },
  { key: "returns", label: "Devoluciones", description: "Devoluciones", icon: "fa-solid fa-rotate-left" },
  { key: "metrics", label: "Metricas", description: "Metricas AR", icon: "fa-solid fa-chart-bar" },
  { key: "settings", label: "Config.", description: "Configuracion", icon: "fa-solid fa-gear" },
];

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-[#121316] text-slate-400 flex flex-col flex-shrink-0 z-20 shadow-xl border-r border-slate-800/50">
      <div className="p-6 flex items-center justify-between">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="logo-container text-2xl font-black tracking-wider text-white flex items-center">
            FITLOOK
            <span className="ml-2 text-[10px] font-bold tracking-widest uppercase bg-brand-green text-black px-1.5 py-0.5 rounded-md">
              ADMIN
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:text-white hover:bg-white/5 text-left ${
                isActive ? "bg-white/[0.08] border-l-4 border-brand-green text-white" : ""
              }`}
            >
              <i className={`${item.icon} w-5 h-5 ${isActive ? "text-brand-green" : ""}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 bg-[#0e0f11]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center text-sm font-bold border-2 border-brand-green/30">
              G
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0e0f11]" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white text-sm">George</p>
              <p className="text-slate-400 text-[10px] italic">Super Admin</p>
            </div>
          </div>
          <i className="fa-solid fa-right-from-bracket text-slate-500 hover:text-rose-400 transition-colors text-xs" />
        </div>
      </div>
    </aside>
  );
}
