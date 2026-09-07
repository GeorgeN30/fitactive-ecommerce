import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { mockProducts } from "../../data/mock";

type Section = "dashboard" | "inventory" | "alerts" | "restocking" | "notifications" | "config";

type StockState = Record<string, Record<string, number>>;

const LEVEL_CONFIG: Record<string, { label: string; cls: string; badge: string; border: string }> = {
  ok: { label: "En stock", cls: "bg-green-100 text-green-700", badge: "fa-circle", border: "" },
  low: { label: "Stock bajo", cls: "bg-amber-100 text-amber-700", badge: "fa-flag", border: "border-l-4 border-amber-400" },
  critical: { label: "Stock crítico", cls: "bg-orange-100 text-orange-700", badge: "fa-triangle-exclamation", border: "border-l-4 border-orange-500" },
  out: { label: "Agotado", cls: "bg-red-100 text-red-600", badge: "fa-circle-xmark", border: "border-l-4 border-red-500" },
};

const STOCK_COLORS: Record<string, string> = {
  ok: "#10b981",
  low: "#f59e0b",
  critical: "#f97316",
  out: "#ef4444",
};

export default function ReceptionistLayout() {
  const { logout } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stocks, setStocks] = useState<StockState>(
    Object.fromEntries(mockProducts.map((p) => [p.id, Object.fromEntries(p.sizes.map((s) => [s.size, s.stock]))]))
  );
  const [restockQtys, setRestockQtys] = useState<Record<string, number>>({});
  const [restocked, setRestocked] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [configToggles, setConfigToggles] = useState({ a: true, b: true, c: true });

  const getStockTotal = (productId: string) =>
    Object.values(stocks[productId] || {}).reduce((a, b) => a + b, 0);

  const getStockLevel = (productId: string): keyof typeof LEVEL_CONFIG => {
    const total = getStockTotal(productId);
    const product = mockProducts.find((p) => p.id === productId);
    if (total === 0) return "out";
    if (total <= 2) return "critical";
    if (product && total <= Math.max(5, Math.floor(product.totalStock * 0.25))) return "low";
    return "ok";
  };

  const alertProducts = mockProducts.filter((p) => getStockLevel(p.id) !== "ok");

  const stockOk = mockProducts.filter((p) => getStockLevel(p.id) === "ok").length;
  const stockLow = mockProducts.filter((p) => getStockLevel(p.id) === "low").length;
  const stockCritical = mockProducts.filter((p) => getStockLevel(p.id) === "critical").length;
  const stockOut = mockProducts.filter((p) => getStockLevel(p.id) === "out").length;

  const handleRestock = (productId: string) => {
    const qty = restockQtys[productId] || 10;
    const p = mockProducts.find((x) => x.id === productId)!;
    const firstSize = p.sizes[0].size;
    setStocks((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [firstSize]: (prev[productId]?.[firstSize] || 0) + qty },
    }));
    setRestocked((prev) => new Set(prev).add(productId));
    setTimeout(() => {
      setRestocked((prev) => {
        const s = new Set(prev);
        s.delete(productId);
        return s;
      });
    }, 3000);
  };

  const filteredProducts = mockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const level = getStockLevel(p.id);
    const matchFilter = filterStatus === "all" || level === filterStatus;
    return matchSearch && matchFilter;
  });

  const navItems: { key: Section; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "fa-chart-line" },
    { key: "inventory", label: "Inventario", icon: "fa-box" },
    { key: "alerts", label: "Alertas de Stock", icon: "fa-triangle-exclamation" },
    { key: "restocking", label: "Reabastecimiento", icon: "fa-rotate" },
    { key: "notifications", label: "Notificaciones", icon: "fa-bell" },
    { key: "config", label: "Configuración", icon: "fa-gear" },
  ];

  const sectionTitle = navItems.find((n) => n.key === section)?.label || "Dashboard";

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white w-64 flex-shrink-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-dumbbell text-[#0A0A0A] text-sm" />
          </div>
          <div>
            <div className="font-black text-base tracking-widest uppercase leading-none">FITLOOK</div>
            <div className="text-[10px] text-amber-400 uppercase tracking-wider mt-1">Inventario</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setSection(item.key);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
              section === item.key ? "bg-amber-400 text-[#0A0A0A]" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className={`fa-solid ${item.icon} w-5 h-5 ${section === item.key ? "text-[#0A0A0A]" : ""}`} />
            {item.label}
            {item.key === "alerts" && alertProducts.length > 0 && (
              <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {alertProducts.length}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
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
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "En stock", value: stockOk, icon: "fa-circle-check", bg: "bg-green-50", text: "text-green-700" },
          { label: "Stock bajo", value: stockLow, icon: "fa-flag", bg: "bg-amber-50", text: "text-amber-700" },
          { label: "Stock crítico", value: stockCritical, icon: "fa-triangle-exclamation", bg: "bg-orange-50", text: "text-orange-700" },
          { label: "Agotados", value: stockOut, icon: "fa-circle-xmark", bg: "bg-red-50", text: "text-red-700" },
        ].map((kpi) => (
          <div key={kpi.label} className={`${kpi.bg} rounded-2xl p-5 border border-white`}>
            <div className={`text-2xl mb-2 ${kpi.text}`}>
              <i className={`fa-solid ${kpi.icon}`} />
            </div>
            <div className={`text-4xl font-black ${kpi.text}`}>{kpi.value}</div>
            <p className={`text-sm font-medium mt-1 ${kpi.text}`}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {alertProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-amber-500" />
              Alertas de inventario
            </h3>
            <button onClick={() => setSection("alerts")} className="text-xs font-semibold text-amber-600 hover:underline flex items-center gap-1">
              Ver todas <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>
          <div className="space-y-2">
            {alertProducts.slice(0, 4).map((p) => {
              const level = getStockLevel(p.id) as keyof typeof LEVEL_CONFIG;
              const total = getStockTotal(p.id);
              const cfg = LEVEL_CONFIG[level];
              return (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 ${cfg.border}`}>
                  <i className={`fa-solid ${cfg.badge} text-lg ${level === "ok" ? "text-green-500" : level === "low" ? "text-amber-500" : level === "critical" ? "text-orange-500" : "text-red-500"}`} />
                  <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{total} unidades · SKU {p.sku}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                  <button onClick={() => handleRestock(p.id)} className="text-xs font-semibold px-3 py-1.5 bg-[#0A0A0A] text-white rounded-lg hover:bg-gray-800 transition-all whitespace-nowrap">
                    Reabastecer
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Estado del inventario</h3>
          <div className="space-y-2">
            {[
              { label: "En stock", count: stockOk, color: STOCK_COLORS.ok },
              { label: "Stock bajo", count: stockLow, color: STOCK_COLORS.low },
              { label: "Stock crítico", count: stockCritical, color: STOCK_COLORS.critical },
              { label: "Agotados", count: stockOut, color: STOCK_COLORS.out },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{s.label}</span>
                  <span className="font-bold">{s.count} productos</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(s.count / mockProducts.length) * 100}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Acciones rápidas</h3>
          <div className="space-y-2">
            {[
              { label: `Ver ${alertProducts.length} alertas activas`, desc: "Productos por debajo del mínimo", icon: "fa-triangle-exclamation", section: "alerts" as Section },
              { label: "Registrar reabastecimiento", desc: "Actualizar stock de productos", icon: "fa-box-open", section: "restocking" as Section },
              { label: "Ver inventario completo", desc: `${mockProducts.length} productos registrados`, icon: "fa-list", section: "inventory" as Section },
            ].map((a) => (
              <button key={a.label} onClick={() => setSection(a.section)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                <span className="text-lg text-amber-500">
                  <i className={`fa-solid ${a.icon}`} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{a.label}</p>
                  <p className="text-xs text-gray-400">{a.desc}</p>
                </div>
                <i className="fa-solid fa-chevron-right text-sm text-gray-400 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass text-sm absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar producto..."
            className="pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm w-full bg-white focus:outline-none focus:border-amber-400" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none">
          <option value="all">Todos</option>
          <option value="ok">En stock</option>
          <option value="low">Stock bajo</option>
          <option value="critical">Crítico</option>
          <option value="out">Agotado</option>
        </select>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Producto", "Categoría", "Tallas / Stock", "Total", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const level = getStockLevel(p.id) as keyof typeof LEVEL_CONFIG;
                const total = getStockTotal(p.id);
                const cfg = LEVEL_CONFIG[level];
                return (
                  <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${level !== "ok" ? "bg-amber-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sport}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.sizes.map((s) => (
                          <span key={s.size} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${(stocks[p.id]?.[s.size] || 0) === 0 ? "bg-red-100 text-red-600" : (stocks[p.id]?.[s.size] || 0) <= 2 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                            {s.size}:{stocks[p.id]?.[s.size] || 0}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">{total}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleRestock(p.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${restocked.has(p.id) ? "bg-green-100 text-green-700" : "bg-[#0A0A0A] text-white hover:bg-gray-800"}`}>
                        {restocked.has(p.id) ? "✓ Listo" : "+Stock"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-4">
      {alertProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
          <i className="fa-solid fa-circle-check text-4xl text-green-400 mb-3" />
          <h3 className="font-bold text-green-700">¡Inventario normal!</h3>
          <p className="text-gray-500 text-sm">Todos los productos tienen stock suficiente.</p>
        </div>
      ) : (
        alertProducts.map((p) => {
          const level = getStockLevel(p.id) as keyof typeof LEVEL_CONFIG;
          const total = getStockTotal(p.id);
          const cfg = LEVEL_CONFIG[level];
          return (
            <div key={p.id} className={`bg-white rounded-2xl p-5 border border-gray-100 ${cfg.border}`}>
              <div className="flex items-center gap-4">
                <i className={`fa-solid ${cfg.badge} text-2xl ${level === "low" ? "text-amber-500" : level === "critical" ? "text-orange-500" : "text-red-500"}`} />
                <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{p.name}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{p.category} · {p.sport}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div><span className="text-gray-400">Stock actual:</span> <span className="font-bold text-gray-900">{total}</span></div>
                    <div><span className="text-gray-400">SKU:</span> <span className="font-bold text-gray-900">{p.sku}</span></div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleRestock(p.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${restocked.has(p.id) ? "bg-green-100 text-green-700" : "bg-[#0A0A0A] text-white hover:bg-gray-800"}`}>
                    {restocked.has(p.id) ? (<><i className="fa-solid fa-check" /> Actualizado</>) : (<><i className="fa-solid fa-rotate" /> Reabastecer</>)}
                  </button>
                  <button onClick={() => setSection("inventory")} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">
                    Ver producto
                  </button>
                </div>
              </div>
              {restocked.has(p.id) && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <i className="fa-solid fa-check text-green-600" />
                  <span className="text-green-700 text-sm font-semibold">Inventario actualizado · Stock normalizado</span>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderRestocking = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-900 mb-2">Registrar reabastecimiento</h3>
        <p className="text-sm text-gray-500">Selecciona el producto y la cantidad a agregar al inventario.</p>
      </div>
      {mockProducts.map((p) => {
        const level = getStockLevel(p.id) as keyof typeof LEVEL_CONFIG;
        const total = getStockTotal(p.id);
        const cfg = LEVEL_CONFIG[level];
        const qty = restockQtys[p.id] || 10;
        const priority = level === "out" ? "Alta" : level === "critical" ? "Media-alta" : level === "low" ? "Media" : "Baja";
        const priorityCls = level === "out" ? "text-red-600 bg-red-50" : level === "critical" ? "text-orange-600 bg-orange-50" : level === "low" ? "text-amber-600 bg-amber-50" : "text-gray-500 bg-gray-50";
        return (
          <div key={p.id} className={`bg-white rounded-2xl p-5 border border-gray-100 ${level !== "ok" ? "border-l-4 border-amber-400" : ""}`}>
            <div className="flex items-center gap-4">
              <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>Stock: <strong className="text-gray-900">{total}</strong></span>
                  <span>Total: <strong>{p.totalStock}</strong></span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${priorityCls}`}>Prioridad: {priority}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setRestockQtys((r) => ({ ...r, [p.id]: Math.max(1, qty - 5) }))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 font-bold">−</button>
                  <span className="w-10 text-center text-sm font-mono font-bold">{qty}</span>
                  <button onClick={() => setRestockQtys((r) => ({ ...r, [p.id]: qty + 5 }))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 font-bold">+</button>
                </div>
                <button onClick={() => handleRestock(p.id)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${restocked.has(p.id) ? "bg-green-100 text-green-700" : "bg-[#0A0A0A] text-white hover:bg-gray-800 hover:scale-105"}`}>
                  {restocked.has(p.id) ? "✓ Listo" : "Registrar"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-3 max-w-2xl">
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2">Centro de notificaciones</h3>
        <p className="text-sm text-gray-500">Alertas de stock y actividades recientes.</p>
      </div>
      {alertProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
          <i className="fa-solid fa-bell text-3xl text-gray-300 mb-3" />
          <p className="text-gray-500">Sin notificaciones de stock</p>
        </div>
      ) : (
        alertProducts.map((p) => {
          const level = getStockLevel(p.id) as keyof typeof LEVEL_CONFIG;
          const total = getStockTotal(p.id);
          return (
            <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-100 border-l-4 border-l-amber-400">
              <div className="flex items-start gap-3">
                <div className={`text-lg flex-shrink-0 ${level === "out" ? "text-red-500" : level === "critical" ? "text-orange-500" : "text-amber-500"}`}>
                  <i className="fa-solid fa-triangle-exclamation" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Stock {LEVEL_CONFIG[level].label.toLowerCase()} · {p.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{total} unidades restantes · SKU {p.sku}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Hoy</p>
                </div>
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderConfig = () => {
    const items = [
      { key: "a" as const, label: "Alertas automáticas de stock bajo", desc: "Notificar cuando el stock alcance el mínimo" },
      { key: "b" as const, label: "Notificaciones de agotados", desc: "Aviso inmediato cuando un producto llega a 0" },
      { key: "c" as const, label: "Reporte semanal de inventario", desc: "Resumen cada lunes a las 9:00 AM" },
    ];
    return (
      <div className="max-w-md bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Configuración del inventario</h3>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <button
                onClick={() => setConfigToggles((t) => ({ ...t, [item.key]: !t[item.key] }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${configToggles[item.key] ? "bg-amber-400" : "bg-gray-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${configToggles[item.key] ? "right-1" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-shell flex h-screen overflow-hidden">
      <div className="hidden lg:block"><Sidebar /></div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10"><Sidebar /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
            <i className="fa-solid fa-bars text-lg" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 capitalize">{sectionTitle}</h2>
            <p className="text-xs text-gray-400">Gestión de inventario · FITLOOK</p>
          </div>
          <div className="flex items-center gap-3">
            {alertProducts.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-amber-700">
                <i className="fa-solid fa-triangle-exclamation text-xs" /> {alertProducts.length} alertas activas
              </div>
            )}
            <button onClick={() => setSection("notifications")} className="relative text-gray-500">
              <i className="fa-solid fa-bell text-lg" />
              {alertProducts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00E87A] text-[#0A0A0A] text-[9px] font-bold rounded-full flex items-center justify-center">
                  {alertProducts.length}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#F5F5F5] custom-scrollbar">
          {section === "dashboard" && renderDashboard()}
          {section === "inventory" && renderInventory()}
          {section === "alerts" && renderAlerts()}
          {section === "restocking" && renderRestocking()}
          {section === "notifications" && renderNotifications()}
          {section === "config" && renderConfig()}
        </main>
      </div>
    </div>
  );
}
