import React from 'react';

interface IncompatibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateMeasures: () => void;
  onTryOther: () => void;
  onAddAnyway: () => void;
}

export default function IncompatibleModal({ isOpen, onClose, onUpdateMeasures, onTryOther, onAddAnyway }: IncompatibleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-[#1a1d24] w-full max-w-md rounded-3xl shadow-2xl p-8 text-center border border-gray-100 dark:border-white/5 scale-100 transition-transform relative">
        <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white">
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>

        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">Prenda no compatible</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 px-4 font-medium">Esta prenda no se ajusta perfectamente a tus medidas actuales.</p>

        <div className="space-y-3">
          <button
            onClick={onUpdateMeasures}
            className="w-full py-3.5 bg-brand-green text-black font-black uppercase text-xs rounded-xl hover:scale-[1.02] transition-transform shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
          >
            Actualizar mis medidas
          </button>

          <button
            onClick={onTryOther}
            className="w-full py-3.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold uppercase text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Ver otras propuestas
          </button>

          <button
            onClick={onTryOther}
            className="w-full py-3.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold uppercase text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Probar otra talla
          </button>

          <button
            onClick={onAddAnyway}
            className="w-full py-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium text-xs mt-2 transition-colors"
          >
            Agregar de todas formas
          </button>
        </div>

      </div>
    </div>
  );
}
