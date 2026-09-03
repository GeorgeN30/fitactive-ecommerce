import { useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "warning" | "info";
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const styles: Record<string, string> = {
    success: "bg-slate-900 text-white border-l-4 border-brand-green",
    warning: "bg-amber-50 text-amber-900 border-l-4 border-amber-500",
    info: "bg-white text-slate-700 border-l-4 border-blue-500 shadow-lg",
  };

  const icons: Record<string, string> = {
    success: "fa-solid fa-circle-check text-brand-green",
    warning: "fa-solid fa-triangle-exclamation text-amber-500",
    info: "fa-solid fa-circle-info text-blue-500",
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold animate-fade-in pointer-events-auto ${styles[toast.type]}`}>
      <i className={`${icons[toast.type]} text-sm`} />
      <span>{toast.message}</span>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastMessage["type"] = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
