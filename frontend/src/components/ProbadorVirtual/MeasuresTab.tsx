import React, { useState } from 'react';

interface MeasuresTabProps {
  medidas: any;
  setMedidas: (m: any) => void;
  altura: number;
  setAltura: (a: number) => void;
  onSave: () => void;
}

export default function MeasuresTab({ medidas, setMedidas, altura, setAltura, onSave }: MeasuresTabProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setTimeout(() => setSaving(false), 800);
  };

  const inputs = [
    { id: 'pecho', label: 'Pecho', val: medidas.pecho, set: (v: number) => setMedidas({...medidas, pecho: v}) },
    { id: 'cintura', label: 'Cintura', val: medidas.cintura, set: (v: number) => setMedidas({...medidas, cintura: v}) },
    { id: 'cadera', label: 'Cadera', val: medidas.cadera, set: (v: number) => setMedidas({...medidas, cadera: v}) },
    { id: 'altura', label: 'Altura', val: altura, set: setAltura },
    { id: 'muslo', label: 'Piernas', val: medidas.muslo, set: (v: number) => setMedidas({...medidas, muslo: v}) },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="mb-6">
        <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-widest flex items-center justify-between">
          Mis Medidas
          <span className="bg-brand-green/20 text-brand-green text-[10px] px-2 py-0.5 rounded-full">cm</span>
        </h3>
        <p className="text-xs text-gray-500 mt-2 font-medium">Usa el slider o escribe tu medida directamente en el campo numérico.</p>
      </div>

      <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
        {inputs.map(input => (
          <div key={input.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">{input.label}</label>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg p-1">
                <button onClick={() => input.set(Math.max(40, input.val - 1))} className="w-6 h-6 flex items-center justify-center font-bold text-gray-500 hover:text-black dark:hover:text-white">-</button>
                <input 
                  type="number" 
                  value={input.val} 
                  onChange={(e) => input.set(Number(e.target.value))}
                  className="w-10 text-center font-black text-sm bg-transparent border-none outline-none"
                />
                <span className="text-[10px] font-bold text-gray-400">cm</span>
                <button onClick={() => input.set(Math.min(220, input.val + 1))} className="w-6 h-6 flex items-center justify-center font-bold text-gray-500 hover:text-black dark:hover:text-white">+</button>
              </div>
            </div>
            <input
              type="range"
              min="40"
              max="220"
              value={input.val}
              onChange={(e) => input.set(Number(e.target.value))}
              className="w-full accent-brand-green cursor-pointer h-2 bg-gray-200 rounded-full appearance-none dark:bg-gray-700"
            />
          </div>
        ))}
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 mt-4 bg-brand-green text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#0ea5e9] hover:text-white transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar Medidas'}
      </button>
    </div>
  );
}
