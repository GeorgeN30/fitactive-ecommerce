import { useState, useMemo } from "react";
import type { Order, OrderStatus } from "../../data/types";
import { mockOrders, mockProducts } from "../../data/mock";
import StatusBadge from "../../components/admin/StatusBadge";

const statusFilters: OrderStatus[] = ["Confirmed", "Preparing", "Pending", "Shipped", "Delivered", "Cancelled", "Returned"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "Ahora mismo";
  if (diffH < 24) return `hace ${diffH}h`;
  return d.toLocaleDateString("es-CL", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminOrders() {
  const [orders] = useState<Order[]>(mockOrders);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const preparingOrders = orders.filter((o) => o.status === "Preparing").length;
  const shippedOrders = orders.filter((o) => o.status === "Shipped").length;
  const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.clientName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || o.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Gestion de Pedidos</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Hoy, {new Date().toLocaleDateString("es-CL", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <button className="bg-brand-green hover:bg-brand-green-hover text-black text-xs font-bold px-5 py-3 rounded-xl shadow-sm flex items-center gap-2 transition-all">
          <i className="fa-solid fa-download text-xs" />
          <span>Exportar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Pedidos</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{totalOrders}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Pendientes</span>
          <h3 className="text-2xl font-black text-amber-500 mt-1">{pendingOrders}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">requiere verificacion</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">En Proceso</span>
          <h3 className="text-2xl font-black text-blue-500 mt-1">{preparingOrders}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">en almacen</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Enviados</span>
          <h3 className="text-2xl font-black text-purple-500 mt-1">{shippedOrders}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">en transito</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Entregados</span>
          <h3 className="text-2xl font-black text-emerald-500 mt-1">{deliveredOrders}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">operaciones exitosas</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por ID, cliente..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-green text-xs rounded-xl focus:outline-none font-semibold" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer">
          <option value="">Estado: Todos</option>
          {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">ID Pedido</th>
                <th className="py-3.5 px-6">Cliente</th>
                <th className="py-3.5 px-6">Fecha</th>
                <th className="py-3.5 px-6">Items</th>
                <th className="py-3.5 px-6">Total</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filtered.map((order) => (
                <Fragment key={order.id}>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">#{order.orderNumber}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{order.clientName}</td>
                    <td className="py-4 px-6 text-slate-400">{formatDate(order.date)}</td>
                    <td className="py-4 px-6 text-slate-500">{order.items.length} items</td>
                    <td className="py-4 px-6 font-extrabold text-slate-900">${order.total.toFixed(2)}</td>
                    <td className="py-4 px-6"><StatusBadge status={order.status} /></td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        aria-label={expandedOrder === order.id ? "Contraer" : "Expandir"}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      >
                        <i className={`fa-solid fa-eye text-xs`} />
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr>
                      <td colSpan={7} className="bg-slate-50 px-6 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Items del Pedido</h4>
                            <div className="space-y-3">
                              {order.items.map((item, i) => {
                                const product = mockProducts.find((p) => p.sku === item.sku || p.name === item.name);
                                return (
                                  <div key={`${item.sku}-${item.size}-${i}`} className="flex items-center gap-3 text-xs">
                                    <img
                                      src={product?.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop"}
                                      alt={item.name}
                                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-slate-700 font-bold truncate">{item.name}</p>
                                      <p className="text-slate-400 mt-0.5">Talla {item.size} · Cant {item.quantity}</p>
                                    </div>
                                    <span className="font-bold text-slate-900 whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Direccion de Envio</h4>
                            <p className="text-xs text-slate-600">{order.shippingAddress}</p>
                            <p className="text-xs text-slate-400 mt-1">Express DHL</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Pago</h4>
                            <p className="text-xs text-slate-600">{order.paymentMethod}</p>
                            <p className="text-xs text-emerald-600 mt-1 font-bold">Aprobado</p>
                          </div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-200">
                          <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Progreso</h4>
                          <div className="flex items-center gap-2">
                            {["Pedido Recibido", "Pago Confirmado", "Preparando"].map((step, i) => (
                              <div key={step} className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 2 ? "bg-brand-green text-black" : "bg-slate-200 text-slate-500"}`}>
                                  {i + 1}
                                </div>
                                <span className="text-[11px] font-semibold text-slate-600">{step}</span>
                                {i < 2 && <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 mx-1" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
