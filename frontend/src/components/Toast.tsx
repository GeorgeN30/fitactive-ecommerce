import { useEffect } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
};

export default function Toast({
  message,
  type = "success",
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const icon =
    type === "success" ? "✓" : type === "error" ? "!" : "i";

  return (
    <div
      className="
        fixed top-20 right-6 z-[9999]
        flex items-center gap-3
        min-w-[300px] max-w-[420px]
        rounded-2xl
        border
        px-5 py-4
        shadow-2xl
        transition-all duration-300
        bg-white border-gray-200 text-gray-900
        dark:bg-black dark:border-brand-green dark:text-white
      "
    >
      <div
        className="
          flex h-9 w-9 shrink-0
          items-center justify-center
          rounded-full
          bg-brand-green
          text-black
          font-black
        "
      >
        {icon}
      </div>

      <p className="flex-1 text-sm font-semibold">
        {message}
      </p>

      <button
        onClick={onClose}
        className="
          text-gray-400
          hover:text-gray-900
          dark:hover:text-white
          transition
          text-lg
          font-bold
        "
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
}