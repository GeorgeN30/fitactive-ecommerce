import type { OrderView } from "../services/orders";
import { formatSoles } from "../utils/money";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  CONFIRMADO: "Confirmado",
  pending: "Pendiente de pago",
  PENDIENTE: "Pendiente de pago",
  preparing: "Preparando",
  PREPARANDO: "Preparando",
  shipped: "Enviado",
  ENVIADO: "Enviado",
  delivered: "Entregado",
  ENTREGADO: "Entregado",
  cancelled: "Cancelado",
  CANCELADO: "Cancelado",
  return: "Devolución",
  RETURN: "Devolución",
  returned: "Devuelto",
  DEVUELTO: "Devuelto",
};

function orderStatusLabel(status: string): string {
  const normalized = status.trim();
  return STATUS_LABELS[normalized] || STATUS_LABELS[normalized.toLowerCase()] || normalized;
}

export default function OrderReceipt({
  order,
  title = "Comprobante de compra",
}: {
  order: OrderView;
  title?: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-left shadow-sm dark:border-gray-700 dark:bg-brand-card-dark print:border-gray-300 print:bg-white print:text-black print:shadow-none">
      <div className="flex items-start justify-between gap-4 border-b border-dashed border-gray-300 pb-5 dark:border-gray-700 print:border-gray-300">
        <div>
          <p className="text-xl font-black text-gray-900 dark:text-white print:text-black">FITLOOK</p>
          <p className="mt-1 text-xs text-gray-400">{title}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <i className="fa-solid fa-print mr-2" />
          Imprimir / guardar PDF
        </button>
      </div>

      <div className="grid gap-3 py-5 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-400">Pedido</p>
          <p className="font-black text-gray-900 dark:text-white print:text-black">{order.numero}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Fecha</p>
          <p className="font-bold text-gray-900 dark:text-white print:text-black">
            {order.fechaOrden ? new Date(order.fechaOrden).toLocaleString("es-PE") : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Estado</p>
          <p className="font-bold text-brand-green">{orderStatusLabel(order.estado)}</p>
        </div>
      </div>

      <div className="space-y-3 border-y border-gray-100 py-5 dark:border-gray-800 print:border-gray-300">
        {order.entries.map((entry) => (
          <div key={entry.productoTallaId} className="flex items-start justify-between gap-4 text-sm">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={entry.imagenUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=120&h=120&fit=crop"}
                alt={entry.nombre}
                className="h-14 w-14 shrink-0 rounded-xl object-contain bg-gray-50 p-1 print:border print:border-gray-200"
              />
              <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white print:text-black">{entry.nombre}</p>
              <p className="text-gray-500">Talla {entry.talla} · {entry.cantidad} unidad(es)</p>
              </div>
            </div>
            <p className="font-bold text-gray-900 dark:text-white print:text-black">{formatSoles(entry.subtotal)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-5">
        <span className="font-extrabold text-gray-900 dark:text-white print:text-black">Total</span>
        <span className="text-xl font-black text-gray-900 dark:text-white print:text-black">{formatSoles(order.total)}</span>
      </div>

      {(order.shippingAddress || order.shippingCity) && (
        <div className="mt-5 border-t border-gray-100 pt-5 text-sm dark:border-gray-800 print:border-gray-300">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Entrega</p>
          <p className="mt-1 text-gray-700 dark:text-gray-300 print:text-black">
            {[order.shippingAddress, order.shippingDistrict, order.shippingCity].filter(Boolean).join(", ")}
          </p>
          {order.shippingReference && <p className="text-gray-500">Referencia: {order.shippingReference}</p>}
        </div>
      )}
    </section>
  );
}
