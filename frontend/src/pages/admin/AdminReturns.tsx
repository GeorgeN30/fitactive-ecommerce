export default function AdminReturns() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Centro de Devoluciones
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Gestiona solicitudes de devolucion y reembolsos.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-5">
          <i className="fa-solid fa-rotate-left text-3xl text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">
          Sin Solicitudes Pendientes
        </h3>
        <p className="text-xs text-slate-400 max-w-md">
          Actualmente no hay solicitudes de reembolso pendientes. Todos los
          reclamos del mes fueron resueltos.
        </p>
      </div>
    </div>
  );
}
