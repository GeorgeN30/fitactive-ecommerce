import { useState } from "react";

export default function AdminSettings() {
  const [realTimeNotifications, setRealTimeNotifications] = useState(true);
  const [autoARSync, setAutoARSync] = useState(true);

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Configuracion</h1>
        <p className="text-xs font-medium text-slate-500 mt-0.5">Configuracion del sistema y preferencias.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Notificaciones en tiempo real</h3>
            <p className="text-xs text-slate-400 mt-0.5">Recibe alertas sobre ventas y stock bajo</p>
          </div>
          <button
            onClick={() => setRealTimeNotifications(!realTimeNotifications)}
            className={`relative w-12 h-6 rounded-full transition-colors ${realTimeNotifications ? "bg-brand-green" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${realTimeNotifications ? "translate-x-6" : ""}`} />
          </button>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sincronizacion AR Automatica</h3>
            <p className="text-xs text-slate-400 mt-0.5">Actualiza renderizado 3D de prendas al instante</p>
          </div>
          <button
            onClick={() => setAutoARSync(!autoARSync)}
            className={`relative w-12 h-6 rounded-full transition-colors ${autoARSync ? "bg-brand-green" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoARSync ? "translate-x-6" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
