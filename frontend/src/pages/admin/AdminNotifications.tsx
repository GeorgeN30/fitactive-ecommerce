import { mockNotifications } from "../../data/mock";
import type { AdminTab } from "../../components/admin/AdminSidebar";

interface AdminNotificationsProps {
  onNavigate: (tab: AdminTab) => void;
}

export default function AdminNotifications({ onNavigate }: AdminNotificationsProps) {
  return (
    <div className="space-y-4 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Centro de Notificaciones</h1>
        <p className="text-xs font-medium text-slate-500 mt-0.5">Alertas y actividades importantes del sistema.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        {mockNotifications.map((notification) => (
          <div key={notification.id} className="p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notification.type === "order" ? "bg-brand-green/10 text-brand-green" : "bg-amber-100 text-amber-600"}`}>
              <i className={`fa-solid ${notification.type === "order" ? "fa-cart-shopping" : "fa-triangle-exclamation"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">{notification.title}</p>
              <p className="text-xs text-slate-500 mt-1">{notification.detail}</p>
            </div>
            <button type="button" onClick={() => onNavigate(notification.targetTab as AdminTab)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700">
              Ver
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
