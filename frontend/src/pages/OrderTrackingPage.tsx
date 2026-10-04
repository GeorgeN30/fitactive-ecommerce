import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ProfileLayout from "../components/ProfileLayout";
import { fetchMyOrders, type OrderView } from "../services/orders";

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchMyOrders()
      .then((loadedOrders) => {
        if (!cancelled) {
          const found = loadedOrders.find(o => o.id === id || o.numero === id);
          if (found) setOrder(found);
          else setError("Pedido no encontrado.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("No pudimos cargar el detalle de la compra.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <ProfileLayout>
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg flex justify-center items-center">
          <p className="text-slate-500">Cargando detalles...</p>
        </div>
      </ProfileLayout>
    );
  }

  if (error || !order) {
    return (
      <ProfileLayout>
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg flex justify-center items-center">
          <p className="text-red-500">{error || "Pedido no encontrado"}</p>
        </div>
      </ProfileLayout>
    );
  }

  const est = order.estado.toLowerCase();
  const step = est === 'entregado' ? 4 : est === 'enviado' ? 3 : est === 'preparando' ? 2 : 1;
  const dateStr = order.fechaOrden ? new Date(order.fechaOrden).toISOString().split("T")[0] : "";

  return (
    <ProfileLayout>
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link to="/mis-compras" className="text-sm font-bold text-slate-500 hover:text-brand-green flex items-center gap-2 mb-6">
            <i className="fa-solid fa-arrow-left"></i> Volver a mis pedidos
          </Link>

          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{order.numero}</h1>
              <p className="text-slate-500 mt-1">Pedido del {dateStr}</p>
            </div>
            <span className="bg-[#E5FF00]/20 text-black dark:text-[#E5FF00] font-black px-4 py-2 rounded-full text-sm uppercase">
              {order.estado}
            </span>
          </div>

          <div className="bg-white dark:bg-brand-card-dark rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
            <h2 className="text-2xl font-black uppercase mb-8 text-slate-900 dark:text-white">Seguimiento</h2>
            
            {/* Vertical Timeline */}
            <div className="relative pl-6 space-y-10 before:absolute before:inset-0 before:left-[35px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#E5FF00] before:to-slate-200 dark:before:to-slate-700">
              
              {/* Step 1 */}
              <div className="relative flex items-start gap-6">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white dark:border-brand-card-dark shrink-0 shadow-md relative z-10 mt-1 ${step >= 1 ? 'bg-[#E5FF00] text-black' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  <i className="fa-solid fa-check text-xs"></i>
                </div>
                <div>
                  <h4 className={`font-black text-lg ${step >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Confirmado</h4>
                  <p className="text-sm text-slate-500 mt-1">Tu pedido fue confirmado y el pago ha sido procesado exitosamente.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start gap-6">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white dark:border-brand-card-dark shrink-0 shadow-md relative z-10 mt-1 ${step >= 2 ? 'bg-[#E5FF00] text-black' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  <i className="fa-solid fa-box text-[10px]"></i>
                </div>
                <div>
                  <h4 className={`font-black text-lg ${step >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Preparando</h4>
                  <p className="text-sm text-slate-500 mt-1">Estamos empaquetando tus prendas cuidadosamente.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start gap-6">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white dark:border-brand-card-dark shrink-0 shadow-md relative z-10 mt-1 ${step >= 3 ? 'bg-[#E5FF00] text-black' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  <i className="fa-solid fa-truck text-[10px]"></i>
                </div>
                <div>
                  <h4 className={`font-black text-lg ${step >= 3 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Enviado</h4>
                  <p className="text-sm text-slate-500 mt-1">El transportista ha recogido tu paquete y está en camino a tu dirección.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex items-start gap-6">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white dark:border-brand-card-dark shrink-0 shadow-md relative z-10 mt-1 ${step >= 4 ? 'bg-[#E5FF00] text-black' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  <i className="fa-solid fa-house text-[10px]"></i>
                </div>
                <div>
                  <h4 className={`font-black text-lg ${step >= 4 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Entregado</h4>
                  <p className="text-sm text-slate-500 mt-1">El pedido ha sido entregado exitosamente.</p>
                </div>
              </div>

            </div>

            {/* Date Estimate */}
            {step < 4 && (
              <div className="mt-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                <div className="bg-white dark:bg-slate-700 p-3 rounded-xl shadow-sm text-brand-green">
                  <i className="fa-regular fa-calendar-check text-xl"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha estimada de entrega</p>
                  <p className="font-black text-slate-900 dark:text-white text-lg">Pronto recibirás actualizaciones</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-brand-card-dark rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
            <h2 className="text-xl font-black uppercase mb-6 text-slate-900 dark:text-white">Productos</h2>
            <div className="space-y-6">
              {order.entries.map(entry => (
                <div key={entry.productoTallaId} className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <img src={entry.imagenUrl || "https://placehold.co/100"} alt="" className="w-16 h-16 rounded-xl bg-slate-50 object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-lg">{entry.nombre}</p>
                      <p className="text-sm text-slate-500">Talla {entry.talla} · x{entry.cantidad}</p>
                    </div>
                  </div>
                  <div className="font-black text-slate-900 dark:text-white text-xl">S/ {Number(entry.subtotal).toFixed(2)}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-500">TOTAL PAGADO</span>
              <span className="font-black text-2xl text-[#E5FF00] bg-black px-4 py-1 rounded-xl">S/ {Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 bg-black text-white dark:bg-white dark:text-black py-4 rounded-xl font-black text-lg transition-transform hover:scale-[1.02]">
              Descargar comprobante
            </button>
            {step < 3 && (
              <button className="flex-1 border-2 border-slate-200 dark:border-slate-700 py-4 rounded-xl font-black text-lg hover:border-red-500 hover:text-red-500 transition-colors">
                Cancelar pedido
              </button>
            )}
          </div>

        </div>
      </div>
    </ProfileLayout>
  );
}
