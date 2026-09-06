import React, { useState } from "react";

export default function AdminNotificationsView() {
  const [adminNotifications, setAdminNotifications] = useState([
    {
      id: "sys-1",
      title: "Alerta de Inventario Crítico",
      message:
        'El producto "Polo Dry-Fit" (Talla M) ha alcanzado el stock mínimo (quedan 2 unidades).',
      type: "stock",
      date: "Hace 10 min",
      read: false,
      priority: "high",
    },
    {
      id: "sys-2",
      title: "Pico de Tráfico en Probador Virtual",
      message:
        "El uso del servidor de renderizado 3D ha superado el 85% de capacidad en la última hora.",
      type: "system",
      date: "Hace 45 min",
      read: false,
      priority: "medium",
    },
    {
      id: "sys-3",
      title: "Nueva Integración: MercadoPago",
      message:
        "Las credenciales de producción de MercadoPago fueron actualizadías exitosamente por el usuario admin.",
      type: "security",
      date: "Hace 2 horas",
      read: true,
      priority: "low",
    },
    {
      id: "sys-4",
      title: "Devolución Procesada Manualmente",
      message:
        "El reembolso para la orden FIT-2024-1782 fue procesado a través de la paísarela y está pendiente de liquidación.",
      type: "payment",
      date: "Hace 3 horas",
      read: true,
      priority: "medium",
    },
    {
      id: "sys-5",
      title: "Reporte Semanal Generado",
      message:
        "El reporte de conversión del probador de la última semana está listo para su descarga.",
      type: "report",
      date: "Ayer",
      read: true,
      priority: "low",
    },
  ]);

  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const markAllRead = () => {
    setAdminNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const takeAction = (id: string) => {
    setResolvingId(id);
    setTimeout(() => {
      setAdminNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                read: true,
                message: n.message + " [RESOLVIDO POR SISTEMA]",
              }
            : n,
        ),
      );
      setResolvingId(null);
    }, 1500);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "stock":
        return "fa-boxes-stacked text-orange-500";
      case "system":
        return "fa-server text-blue-500";
      case "security":
        return "fa-shield-halved text-green-500";
      case "payment":
        return "fa-money-bill-transfer text-purple-500";
      case "report":
        return "fa-file-contract text-gray-500";
      default:
        return "fa-bell text-gray-400";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones del Sistema</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Alertas operativas, de inventario y de seguridad de la tienda
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="text-sm font-bold text-[#00FF66] hover:underline"
        >
          Marcar todías como leídías
        </button>
      </div>

      <div className="space-y-4 max-w-4xl">
        {adminNotifications.map((n) => (
          <div
            key={n.id}
            className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border transition-all shadow-sm ${!n.read ? (n.priority === "high" ? "border-l-4 border-l-red-500 border-gray-100 dark:border-zinc-800" : "border-l-4 border-l-[#00FF66] border-gray-100 dark:border-zinc-800") : "border-gray-100 dark:border-zinc-800 opacity-70 hover:opacity-100"}`}
          >
            <div className="flex items-start gap-5">
              <div
                className={`w-12 h-12 rounded-xl bg-gray-50 dark:bg-zinc-950 flex items-center justify-center text-xl flex-shrink-0 ${!n.read && n.priority === "high" ? "animate-pulse" : ""}`}
              >
                <i className={`fa-solid ${getIcon(n.type)}`} />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex justify-between items-start">
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                    {n.date}
                  </p>
                </div>
                <p
                  className={`text-sm mt-2 leading-relaxed ${n.read && n.message.includes("[RESOLVIDO") ? "text-[#00FF66] font-medium" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {n.message}
                </p>

                {!n.read && (
                  <div className="mt-3">
                    {n.priority === "high" ? (
                      <button
                        onClick={() => takeAction(n.id)}
                        disabled={resolvingId !== null}
                        className={`text-xs font-bold border px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${resolvingId === n.id ? "bg-gray-100 text-gray-500 border-gray-200 dark:bg-zinc-800 dark:border-zinc-700" : "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"}`}
                      >
                        {resolvingId === n.id ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i>{" "}
                            Resolviendo...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-bolt"></i> Tomar Acción
                            Inmediata
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setAdminNotifications((prev) =>
                            prev.map((item) =>
                              item.id === n.id ? { ...item, read: true } : item,
                            ),
                          )
                        }
                        className="text-xs font-bold border px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
                      >
                        <i className="fa-solid fa-check"></i> Marcar como leída
                      </button>
                    )}
                  </div>
                )}
              </div>
              {!n.read && (
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-2.5 flex-shrink-0 ${n.priority === "high" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.6)]"}`}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
