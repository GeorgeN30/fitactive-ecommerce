import React, { useState } from "react";

export default function InventoryNotificationsView({
  notifications,
  setNotifications,
}: any) {
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n: any) => ({ ...n, read: true })));
    showToast("Todías las notificaciones marcadías como leídías");
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((n: any) => n.id !== id));
    showToast("Notificación eliminada");
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white dark:text-white pb-10 max-w-4xl mx-auto relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[60] bg-[#00FF66] text-black px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 animate-fade-in">
          <i className="fa-solid fa-circle-check"></i>
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
            Avisos del sistema y de administradores
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="text-sm font-bold text-[#F59E0B] hover:underline"
        >
          Marcar todías como leídías
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800">
        {notifications.map((n: any) => (
          <div
            key={n.id}
            className={`p-5 flex gap-4 transition-colors relative group ${n.read ? "opacity-70 bg-white dark:bg-zinc-900" : "bg-orange-50/30 dark:bg-zinc-900/50"}`}
          >
            {!n.read && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B]"></div>
            )}

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                n.type === "success"
                  ? "bg-[#00FF66]/20 text-[#00cc52]"
                  : n.type === "critical"
                    ? "bg-red-500/20 text-red-500"
                    : "bg-blue-500/20 text-blue-500"
              }`}
            >
              <i
                className={`fa-solid ${
                  n.type === "success"
                    ? "fa-check"
                    : n.type === "critical"
                      ? "fa-triangle-exclamation"
                      : "fa-bell"
                }`}
              ></i>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4
                  className={`text-sm ${n.read ? "font-semibold text-gray-700 dark:text-gray-300" : "font-black text-gray-900 dark:text-white"}`}
                >
                  {n.title}
                </h4>
                <span className="text-xs text-gray-400 font-medium">
                  {n.time}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {n.message}
              </p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => deleteNotification(n.id)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            <i className="fa-regular fa-bell-slash text-4xl mb-3 opacity-20"></i>
            <p>No tienes notificaciones pendientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
