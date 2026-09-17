import { useState } from "react";

export interface InventoryNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "critical" | "info";
  time: string;
  read: boolean;
}

interface InventoryNotificationsViewProps {
  notifications: InventoryNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<InventoryNotification[]>>;
  onMarkRead?: (notification: InventoryNotification) => void | Promise<void>;
  onMarkAllRead?: () => void | Promise<void>;
}

export default function InventoryNotificationsView({
  notifications,
  setNotifications,
  onMarkRead,
  onMarkAllRead,
}: InventoryNotificationsViewProps) {
  const [toastMessage, setToastMessage] = useState("");
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 3000);
  };

  const markAllRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    void onMarkAllRead?.();
    showToast("Todas las notificaciones fueron marcadas como leídas.");
  };

  const markRead = (notification: InventoryNotification) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    );
    void onMarkRead?.(notification);
  };

  const deleteNotification = (id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
    showToast("Notificación eliminada.");
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10 max-w-4xl mx-auto relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[60] bg-[#00FF66] text-black px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 animate-fade-in">
          <i className="fa-solid fa-circle-check" />
          {toastMessage}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Notificaciones
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {unreadCount} nuevas
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Avisos operativos recibidos en tiempo real
          </p>
        </div>
        <button onClick={markAllRead} className="text-sm font-bold text-[#F59E0B] hover:underline">
          Marcar todas como leídas
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-5 flex gap-4 transition-colors relative group ${notification.read ? "opacity-70" : "bg-orange-50/30 dark:bg-zinc-900/50"}`}
          >
            {!notification.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B]" />}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === "success" ? "bg-[#00FF66]/20 text-[#00cc52]" : notification.type === "critical" ? "bg-red-500/20 text-red-500" : "bg-blue-500/20 text-blue-500"}`}>
              <i className={`fa-solid ${notification.type === "success" ? "fa-check" : notification.type === "critical" ? "fa-triangle-exclamation" : "fa-bell"}`} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold">{notification.title}</h4>
                <span className="text-xs text-gray-400 font-medium">{notification.time}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
              {!notification.read && (
                <button
                  type="button"
                  onClick={() => markRead(notification)}
                  className="mt-2 text-xs font-bold text-[#F59E0B] transition-colors hover:text-[#d97706]"
                >
                  Marcar como leída
                </button>
              )}
            </div>
            <button
              onClick={() => deleteNotification(notification.id)}
              aria-label="Eliminar notificación"
              className="w-8 h-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            <i className="fa-regular fa-bell-slash text-4xl mb-3 opacity-20" />
            <p>No tienes notificaciones pendientes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
