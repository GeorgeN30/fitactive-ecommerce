import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileLayout from "../components/ProfileLayout";
import { fetchMyOrders, type OrderView } from "../services/orders";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchMyOrders()
      .then((loadedOrders) => {
        if (!cancelled) setOrders(loadedOrders);
      })
      .catch(() => {
        if (!cancelled) setError("No pudimos cargar tus compras. Intenta nuevamente.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "entregado") return "bg-[#E5FF00]/20 text-black dark:text-[#E5FF00]";
    if (s === "enviado") return "bg-[#E5FF00]/20 text-black dark:text-[#E5FF00]";
    if (s === "cancelado") return "bg-red-100 text-red-600";
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  };

  return (
    <ProfileLayout>
      <div className="bg-white dark:bg-brand-card-dark rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 min-h-[600px]">
        <h2 className="text-2xl font-black uppercase tracking-wide mb-8 text-slate-900 dark:text-white">Mis Pedidos</h2>

        {loading && <div className="text-center text-gray-500 py-10">Cargando compras...</div>}
        {!loading && error && <div className="text-center text-red-500 py-10">{error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <i className="fa-solid fa-box-open text-4xl mb-4"></i>
            <p>Aún no tienes pedidos.</p>
          </div>
        )}

        <div className="space-y-6">
          {orders.map((order) => {
            const firstProduct = order.entries[0];
            const dateStr = order.fechaOrden ? new Date(order.fechaOrden).toISOString().split("T")[0] : "";
            
            return (
              <div key={order.id} className="border border-slate-200 dark:border-slate-700 rounded-3xl p-6 relative">
                <div className="absolute top-6 right-6">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(order.estado)}`}>
                    {order.estado}
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-black uppercase tracking-wider text-slate-900 dark:text-white">{order.numero}</h3>
                  <p className="text-sm text-slate-500">{dateStr}</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6">
                  {firstProduct && (
                    <div className="flex items-center gap-4">
                      <img 
                        src={firstProduct.imagenUrl || "https://placehold.co/100x100"} 
                        alt={firstProduct.nombre} 
                        className="w-16 h-16 rounded-xl object-cover bg-slate-50"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{firstProduct.nombre}</p>
                        <p className="text-sm text-slate-500">Talla {firstProduct.talla} · x{firstProduct.cantidad}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-6 mt-4 sm:mt-0">
                    <div className="text-xl font-black text-slate-900 dark:text-white">S/ {Number(order.total).toFixed(2)}</div>
                    <div className="flex gap-2">
                      <Link 
                        to={`/mis-compras/${order.id}`}
                        className="px-5 py-2 rounded-full border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-900 dark:text-white transition-colors"
                      >
                        Ver seguimiento
                      </Link>
                      <button className="px-5 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-sm transition-colors">
                        Comprobante
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </ProfileLayout>
  );
}
