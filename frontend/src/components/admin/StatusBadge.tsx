const statusStyles: Record<string, { bg: string; text: string; dot: string }> =
  {
    Active: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    Inactive: {
      bg: "bg-slate-200",
      text: "text-slate-700",
      dot: "bg-slate-500",
    },
    OutOfStock: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
    Blocked: { bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500" },
    Confirmed: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    Preparing: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    Pending: {
      bg: "bg-slate-200",
      text: "text-slate-700",
      dot: "bg-slate-500",
    },
    Shipped: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    Delivered: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    Cancelled: { bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500" },
    Returned: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
    Customer: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      dot: "bg-slate-500",
    },
    Admin: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    Entry: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    Exit: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
    Adjustment: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
  };

const statusLabels: Record<string, string> = {
  active: "Activo",
  in_stock: "En Stock",
  out_of_stock: "Sin Stock",
  low_stock: "Stock Bajo",
  confirmed: "Confirmado",
  preparing: "Preparando",
  pending: "Pendiente",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  returned: "Devuelto",
  blocked: "Bloqueado",
  entry: "Entrada",
  exit: "Salida",
  adjustment: "Ajuste",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.Pending;
  const displayLabel = label || statusLabels[status] || status;
  return (
    <span
      className={`px-3 py-1 rounded-full text-[11px] font-bold ${style.bg} ${style.text} flex items-center gap-1.5 w-fit`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {displayLabel}
    </span>
  );
}
