import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import OrderReceipt from "../components/OrderReceipt";
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

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8f9fa] py-8 dark:bg-brand-dark-bg">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-green">Cuenta</p>
            <h1 className="mt-2 text-3xl font-black text-gray-900 dark:text-white">Mis compras</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Consulta el estado de tus pedidos y vuelve a imprimir tus comprobantes.
            </p>
          </div>

          {loading && <div className="rounded-2xl bg-white p-8 text-center text-gray-500 dark:bg-brand-card-dark">Cargando compras…</div>}
          {!loading && error && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700">{error}</div>}
          {!loading && !error && orders.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-brand-card-dark">
              <i className="fa-solid fa-receipt mb-4 text-4xl text-gray-300" />
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Aún no tienes compras</h2>
              <p className="mt-2 text-sm text-gray-500">Cuando completes un pedido aparecerá aquí.</p>
            </div>
          )}
          <div className="space-y-6">
            {orders.map((order) => <OrderReceipt key={order.id} order={order} />)}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
