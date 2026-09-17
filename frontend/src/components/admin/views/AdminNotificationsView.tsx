import React, { useState } from "react";
import type { AdminNotification } from "../../../services/notifications";

export default function AdminNotificationsView({
  notifications,
  setNotifications,
  onNotificationAction,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications?: AdminNotification[];
  setNotifications?: (updater: (prev: AdminNotification[]) => AdminNotification[]) => void;
  onNotificationAction?: (notification: AdminNotification) => void;
  onMarkRead?: (notification: AdminNotification) => void | Promise<void>;
  onMarkAllRead?: () => void | Promise<void>;
} = {}) {
  const [internalNotifications, setInternalNotifications] = useState<AdminNotification[]>([]);

  const display = notifications !== undefined ? notifications : internalNotifications;

  const apply = (updater: (prev: AdminNotification[]) => AdminNotification[]) => {
    if (setNotifications) setNotifications(updater);
    else setInternalNotifications(updater);
  };

  const markAllRead = () => {
    apply((prev) => prev.map((n) => ({ ...n, read: true })));
    void onMarkAllRead?.();
  };

  const takeAction = (notification: AdminNotification) => {
    apply((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    );
    void onMarkRead?.(notification);
    onNotificationAction?.(notification);
  };

  const markRead = (notification: AdminNotification) => {
    apply((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    );
    void onMarkRead?.(notification);
  };

  const getActionLabel = (type: string): string => {
    if (type === "discount") return "Ver descuentos";
    if (type === "order") return "Ver pedidos";
    if (type === "return") return "Ver devoluciones";
    return "Ver detalle";
  };

  const canNavigate = (type: string): boolean =>
    ["discount", "order", "return"].includes(type);

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
      case "discount":
        return "fa-tag text-indigo-500";
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
          Marcar todas como leídas
        </button>
      </div>

      <div className="space-y-4 max-w-4xl">
        {display.map((n) => (
          <div
            key={n.id}
            className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md ${!n.read ? (n.priority === "high" ? "border-l-4 border-l-red-500 border-gray-100 dark:border-zinc-800" : "border-l-4 border-l-[#00FF66] border-gray-100 dark:border-zinc-800") : "border-gray-100 dark:border-zinc-800 opacity-70 hover:opacity-100"}`}
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
                    {canNavigate(n.type) ? (
                      <button
                        onClick={() => takeAction(n)}
                        className="text-xs font-bold border px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        {getActionLabel(n.type)}
                      </button>
                    ) : (
                      <button
                        onClick={() => markRead(n)}
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
        {display.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No hay notificaciones nuevas.
          </div>
        )}
      </div>
    </div>
  );
}
