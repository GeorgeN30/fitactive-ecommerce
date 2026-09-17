interface NotificationToastData {
  title: string;
  message: string;
  kind?: "info" | "critical" | "success";
}

interface NotificationToastProps {
  notification: NotificationToastData | null;
  onClose: () => void;
  onOpen: () => void;
}

export default function NotificationToast({
  notification,
  onClose,
  onOpen,
}: NotificationToastProps) {
  if (!notification) return null;

  const accent =
    notification.kind === "critical"
      ? "bg-red-500"
      : notification.kind === "success"
        ? "bg-emerald-500"
        : "bg-[#00E87A]";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-[70] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="flex gap-3 p-4">
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${accent}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {notification.title}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-300">
            {notification.message}
          </p>
          <button
            type="button"
            onClick={onOpen}
            className="mt-2 text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-[#00E87A]"
          >
            Ver notificaciones
          </button>
        </div>
        <button
          type="button"
          aria-label="Cerrar notificación"
          onClick={onClose}
          className="h-6 w-6 shrink-0 rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <i className="fa-solid fa-xmark text-xs" />
        </button>
      </div>
    </div>
  );
}
