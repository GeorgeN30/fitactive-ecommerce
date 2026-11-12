import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import OrderReceipt from "../components/OrderReceipt";
import { useCart } from "../context/CartContext";
import { fetchMercadoPagoOrderStatus, fetchMyOrders, type OrderView } from "../services/orders";

type ResultState = "loading" | "approved" | "pending" | "failed" | "error";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id") || "";
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id") || undefined;
  const [state, setState] = useState<ResultState>("loading");
  const [orderNumber, setOrderNumber] = useState("");
  const [detail, setDetail] = useState("");
  const [order, setOrder] = useState<OrderView | null>(null);
  const { completePendingCheckout } = useCart();

  useEffect(() => {
    let cancelled = false;

    if (!orderId) {
      setState("error");
      setDetail("No encontramos el pedido asociado al pago.");
      return () => {
        cancelled = true;
      };
    }

    void fetchMercadoPagoOrderStatus(orderId, paymentId)
      .then((result) => {
        if (cancelled) return;
        setOrderNumber(result.orderNumber);
        const completedOrderStatuses = ["confirmed", "preparing", "shipped", "delivered"];
        if (
          result.paymentStatus === "approved" ||
          completedOrderStatuses.includes(result.orderStatus.toLowerCase())
        ) {
          setState("approved");
          completePendingCheckout(orderId);
        } else if (["rejected", "cancelled", "cancelled_by_payer", "expired"].includes(result.paymentStatus || "")) {
          setState("failed");
        } else {
          setState("pending");
        }
        void fetchMyOrders()
          .then((orders) => {
            if (!cancelled) setOrder(orders.find((candidate) => candidate.id === orderId) || null);
          })
          .catch(() => undefined);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setDetail("Tu sesión expiró. Inicia sesión para consultar el estado del pedido.");
        } else {
          setDetail("No pudimos confirmar el estado todavía. Revisa tu historial de pedidos en unos minutos.");
        }
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [completePendingCheckout, orderId, paymentId]);

  const content = {
    loading: {
      icon: "fa-spinner fa-spin",
      title: "Verificando tu pago",
      message: "Estamos confirmando la respuesta de Mercado Pago.",
      color: "text-gray-500",
    },
    approved: {
      icon: "fa-circle-check",
      title: "Pago aprobado",
      message: "Tu pedido quedó confirmado correctamente.",
      color: "text-brand-green",
    },
    pending: {
      icon: "fa-clock",
      title: "Pago pendiente",
      message: "Mercado Pago todavía está procesando el pago. Te notificaremos cuando cambie.",
      color: "text-amber-500",
    },
    failed: {
      icon: "fa-circle-xmark",
      title: "Pago no aprobado",
      message: "No se confirmó el pago. Puedes revisar otro método desde Mercado Pago.",
      color: "text-red-500",
    },
    error: {
      icon: "fa-triangle-exclamation",
      title: "No pudimos confirmar el pago",
      message: detail || "Intenta consultar nuevamente desde tu historial de pedidos.",
      color: "text-amber-500",
    },
  }[state];

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-brand-dark-bg flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-white dark:bg-brand-card-dark rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 sm:p-10 text-center animate-fade-in">
          <div className={`mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl ${content.color}`}>
            <i className={`fa-solid ${content.icon}`} />
          </div>
          <h1 className="mt-7 text-3xl font-black text-gray-900 dark:text-white">
            {content.title}
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">{content.message}</p>

          {orderNumber && (
            <div className="mt-6 rounded-2xl bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-xs uppercase tracking-wider font-bold text-gray-400">Pedido</p>
              <p className="mt-1 font-black text-gray-900 dark:text-white">{orderNumber}</p>
            </div>
          )}

          {order && (state === "approved" || state === "pending" || state === "failed") && (
            <div className="mt-6 text-left">
              <OrderReceipt order={order} title="Comprobante de compra" />
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="flex-1 py-3.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition"
            >
              Ir al inicio
            </Link>
            <Link
              to="/mis-compras"
              className="flex-1 rounded-xl border border-gray-200 py-3.5 font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Ver mis compras
            </Link>
            {state !== "approved" && (
              <Link
                to="/carrito"
                className="flex-1 rounded-xl border border-brand-green/40 py-3.5 font-bold text-brand-green transition hover:bg-brand-green/10"
              >
                Volver al carrito
              </Link>
            )}
            <Link
              to="/catalogo"
              className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
