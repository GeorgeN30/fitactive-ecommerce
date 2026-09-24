import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import {
  announceNotificationsUpdated,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AdminNotification,
} from "../services/notifications";

function notificationIcon(type: string): string {
  if (type === "payment") return "fa-credit-card";
  if (type === "order") return "fa-truck-fast";
  if (type === "stock") return "fa-boxes-stacked";
  return "fa-bell";
}

function notificationTone(notification: AdminNotification): string {
  if (notification.read) return "border-gray-100 bg-white dark:border-gray-800 dark:bg-brand-card-dark";
  if (notification.priority === "high") return "border-brand-green/30 bg-brand-green/5 dark:bg-brand-green/10";
  return "border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = () => {
    setLoading(true);
    setError("");
    void fetchNotifications()
      .then(setNotifications)
      .catch(() => setError("No pudimos cargar tus notificaciones. Intenta nuevamente."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleRead = (notification: AdminNotification) => {
    if (notification.read) return;
    setNotifications((current) => current.map((item) =>
      item.id === notification.id ? { ...item, read: true } : item,
    ));
    void markNotificationRead(notification.id)
      .then(announceNotificationsUpdated)
      .catch(() => {
        setNotifications((current) => current.map((item) =>
          item.id === notification.id ? { ...item, read: false } : item,
        ));
      });
  };

  const handleMarkAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    void markAllNotificationsRead()
      .then(announceNotificationsUpdated)
      .catch(loadNotifications);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8f9fa] py-8 dark:bg-brand-dark-bg">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-green">Cuenta</p>
              <h1 className="mt-2 text-3xl font-black text-gray-900 dark:text-white">Notificaciones</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Aquí verás las actualizaciones de tus pedidos y pagos.
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-brand-green hover:text-brand-green dark:border-gray-700 dark:bg-brand-card-dark dark:text-gray-200"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          {loading && (
            <div className="rounded-2xl bg-white p-8 text-center text-gray-500 dark:bg-brand-card-dark">
              Cargando notificaciones…
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700">
              {error}
              <button type="button" onClick={loadNotifications} className="ml-2 underline">
                Reintentar
              </button>
            </div>
          )}
          {!loading && !error && notifications.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-brand-card-dark">
              <i className="fa-solid fa-bell mb-4 text-4xl text-gray-300" />
              <h2 className="text-xl font-black text-gray-900 dark:text-white">No tienes notificaciones</h2>
              <p className="mt-2 text-sm text-gray-500">Te avisaremos cuando cambie el estado de un pedido.</p>
            </div>
          )}
          {!loading && !error && notifications.length > 0 && (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleRead(notification)}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${notificationTone(notification)}`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                    <i className={`fa-solid ${notificationIcon(notification.type)}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-black text-gray-900 dark:text-white">{notification.title}</span>
                      <span className="text-xs text-gray-400">{notification.date}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </span>
                    {!notification.read && (
                      <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-green">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-green" /> Nueva
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
