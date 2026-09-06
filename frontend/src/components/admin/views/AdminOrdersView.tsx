import React, { useState } from "react";
import type { Order } from "../../../data/adminPrototypeTypes";

interface AdminOrdersViewProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
}

export default function AdminOrdersView({
  orders,
  updateOrderStatus,
}: AdminOrdersViewProps) {
  const [filter, setFilter] = useState<Order["status"] | "todos">("todos");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders =
    filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  const statuses: { value: Order["status"] | "todos"; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "pending", label: "Pendiente" },
    { value: "confirmed", label: "Confirmado" },
    { value: "preparing", label: "Preparando" },
    { value: "shipped", label: "Enviado" },
    { value: "delivered", label: "Entregado" },
    { value: "cancelled", label: "Cancelado" },
    { value: "return", label: "Devolución" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500";
      case "confirmed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500";
      case "preparing":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-500";
      case "shipped":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-500";
      case "delivered":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500";
      case "return":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-500";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    return statuses.find((s) => s.value === status)?.label || status;
  };

  const handleStatusChange = (status: Order["status"]) => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, status);
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full text-gray-900 dark:text-white animate-fade-in">
      <div className={`flex-1 ${selectedOrder ? "hidden lg:block" : "block"}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {orders.length} pedidos - Filtro activo
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {statuses.map((s) => {
            const count =
              s.value === "todos"
                ? orders.length
                : orders.filter((o) => o.status === s.value).length;
            return (
              <button
                key={s.value}
                onClick={() => setFilter(s.value as Order["status"] | "todos")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === s.value
                    ? "bg-[#00FF66] text-black shadow-md"
                    : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
                }`}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-zinc-950/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id
                        ? "bg-[#00FF66]/10 dark:bg-[#00FF66]/5"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <td className="px-5 py-4 font-bold text-gray-900 dark:text-gray-200">
                      {order.id}
                    </td>
                    <td className="px-5 py-4">{order.customer.name}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {order.date.substring(0, 10)}
                    </td>
                    <td className="px-5 py-4 font-bold text-[#00FF66]">
                      S/ {order.total.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No hay pedidos con este estado.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="w-full lg:w-96 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-lg flex flex-col h-[calc(100vh-6rem)] sticky top-6 animate-slide-in-right">
          <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-950/30 rounded-t-xl">
            <div>
              <h2 className="font-bold text-lg">{selectedOrder.id}</h2>
              <p className="text-xs text-gray-500">
                {selectedOrder.date.substring(0, 10)}
              </p>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(selectedOrder.status)}`}
                >
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">Total</p>
                <p className="text-xl font-black text-[#00FF66]">
                  S/ {selectedOrder.total.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">
                <i className="fa-solid fa-truck text-[#00FF66] mr-2"></i>Envío
              </h3>
              <p className="text-sm font-medium">{selectedOrder.address}</p>
              <p className="text-xs text-gray-500">{selectedOrder.district}</p>
              <p className="text-xs font-mono bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 inline-block px-2 py-1 rounded mt-2">
                TRK-{selectedOrder.id.split("-")[2]}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">
                Productos
              </h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 bg-white dark:bg-zinc-950 p-2 rounded-lg border border-gray-100 dark:border-zinc-800 items-center"
                  >
                    <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-md flex items-center justify-center overflow-hidden">
                      <i className="fa-solid fa-shirt text-gray-400"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {item.productId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Talla: {item.size} | Cant: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/30 rounded-b-xl">
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">
              Cambiar estado
            </h3>
            <div className="flex flex-wrap gap-2">
              {statuses
                .filter((s) => s.value !== "todos")
                .map((s) => (
                  <button
                    key={s.value}
                    onClick={() =>
                      handleStatusChange(s.value as Order["status"])
                    }
                    disabled={selectedOrder.status === s.value}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      selectedOrder.status === s.value
                        ? "bg-[#00FF66] border-[#00FF66] text-black opacity-100 shadow-sm"
                        : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-[#00FF66] hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
