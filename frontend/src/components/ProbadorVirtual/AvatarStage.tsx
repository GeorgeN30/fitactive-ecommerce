import React from 'react';
import Avatar3D from './Avatar3D';

interface AvatarStageProps {
  bodyMetrics: any;
  selectedProduct: any;
  genero: 'Hombre' | 'Mujer';
}

export default function AvatarStage({ bodyMetrics, selectedProduct, genero }: AvatarStageProps) {
  
  // Extraemos las variables de deformación que calculamos en ProbadorVirtual
  const { spriteScales } = bodyMetrics || {};
  const s = spriteScales || { 
    torsoScaleX: 1, torsoScaleY: 1
  };
  
  return (
    <div className="relative flex flex-col h-full w-full items-center justify-center rounded-[3rem] border border-gray-200/50 dark:border-white/10 shadow-[inset_0_0_80px_rgba(16,185,129,0.05)] overflow-hidden bg-gradient-to-b from-transparent to-brand-green/5">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-64 h-96 bg-brand-green/10 blur-3xl rounded-full"></div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center z-10">
        <Avatar3D torsoScaleX={s.torsoScaleX} torsoScaleY={s.torsoScaleY} genero={genero} />
      </div>
      {selectedProduct && (
        <div className="absolute bottom-12 left-4 z-20 flex max-w-[min(18rem,calc(100%-2rem))] items-center gap-3 rounded-2xl border border-white/20 bg-white/90 p-2 shadow-lg backdrop-blur dark:bg-zinc-900/90">
          <img src={selectedProduct.imagen_url || selectedProduct.imagenUrl || selectedProduct.img || "https://placehold.co/120x120"} alt="" className="h-14 w-14 rounded-xl bg-white object-contain" />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Prenda seleccionada</p>
            <p className="truncate text-xs font-bold text-gray-900 dark:text-white">{selectedProduct.nombre || selectedProduct.name}</p>
            {selectedProduct.talla_sugerida && <p className="text-xs text-gray-500">Talla {selectedProduct.talla_sugerida}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
