import React from 'react';

interface AnalyticsPanelProps {
  analisis: any;
  medidas: any;
  altura: number;
  onEditMeasures: () => void;
  onAddToCart: () => void;
}

export default function AnalyticsPanel({ analisis, medidas, altura, onEditMeasures, onAddToCart }: AnalyticsPanelProps) {
  if (!analisis) {
    return (
      <div className="bg-white dark:bg-white/[0.02] p-8 rounded-3xl h-full flex items-center justify-center text-center">
        <p className="text-gray-400 text-sm font-bold">Selecciona una prenda para ver su compatibilidad.</p>
      </div>
    );
  }

  const isLowScore = Number(analisis.matchScore) < 50;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top Block: Compatibilidad Score */}
      <div className="bg-white dark:bg-white/[0.02] p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-white/5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-widest">Compatibilidad</h3>
          <span className={`text-3xl font-black ${isLowScore ? 'text-red-500' : 'text-brand-green'}`}>
            {analisis.matchScore}%
          </span>
        </div>
        
        {/* Progress Bar overall */}
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full mb-4 overflow-hidden">
          <div className={`h-full rounded-full ${isLowScore ? 'bg-red-500' : 'bg-brand-green'} transition-all`} style={{ width: `${analisis.matchScore}%` }}></div>
        </div>

        {isLowScore && (
          <p className="text-[10px] text-gray-500 flex items-center gap-1.5 font-bold mb-4">
            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Algunas medidas están fuera del rango óptimo
          </p>
        )}

        <div className="space-y-4 mt-6">
          {analisis.detalles.map((det: any, idx: number) => {
            if (det.estado === 'No aplica') return null;
            const isDanger = det.estado.includes("Muy");
            return (
              <div key={idx}>
                <div className="flex justify-between text-[11px] font-bold mb-1.5">
                  <span className="text-gray-900 dark:text-white capitalize">{det.zona}</span>
                  <div className="flex gap-2">
                    <span className="text-gray-400">{det.porcentajeVisual.toFixed(0)}%</span>
                    <span className={isDanger ? 'text-red-500' : det.estado.includes("Holgado") ? 'text-yellow-500' : 'text-brand-green'}>{det.estado}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isDanger ? 'bg-red-500' : det.estado.includes("Holgado") ? 'bg-yellow-500' : 'bg-brand-green'}`} style={{ width: `${det.porcentajeVisual}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Block: Recomendación */}
      <div className="bg-white dark:bg-white/[0.02] p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div>
          <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Talla Recomendada</span>
          <span className="text-4xl font-black text-brand-green leading-none">{analisis.talla}</span>
        </div>
        <div className="text-right">
          <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Ajuste General</span>
          <span className={`text-xl font-black ${isLowScore ? 'text-red-500' : 'text-brand-green'} leading-none`}>{analisis.matchScore}%</span>
        </div>
      </div>

      {/* Bottom Block: Summary */}
      <div className="bg-white dark:bg-white/[0.02] p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-white/5 flex flex-col mb-auto">
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Tus Medidas</h4>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
            <span>Pecho</span> <span className="text-gray-900 dark:text-white font-black">{medidas.pecho} cm</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
            <span>Cintura</span> <span className="text-gray-900 dark:text-white font-black">{medidas.cintura} cm</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
            <span>Cadera</span> <span className="text-gray-900 dark:text-white font-black">{medidas.cadera} cm</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
            <span>Altura</span> <span className="text-gray-900 dark:text-white font-black">{altura} cm</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
            <span>Piernas</span> <span className="text-gray-900 dark:text-white font-black">{medidas.muslo} cm</span>
          </div>
        </div>

        <button 
          onClick={onEditMeasures}
          className="w-full py-2.5 mt-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Editar medidas
        </button>

        <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
          <button 
            onClick={onAddToCart}
            className="w-full py-3.5 bg-brand-green text-black font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] transition-transform shadow-[0_5px_15px_rgba(16,185,129,0.2)]"
          >
            Añadir al carrito
          </button>
          <button className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] transition-transform">
            Guardar Outfit
          </button>
        </div>
      </div>
    </div>
  );
}
