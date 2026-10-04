import React from 'react';

export default function OutfitTab({ productos }: { productos: any[] }) {
  // Suggest 2 random products as outfit
  const sugeridos = productos.slice(0, 2);

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-widest mb-6">
        Outfits Sugeridos
      </h3>

      <div className="space-y-4 flex-1">
        {sugeridos.map(prod => (
          <div key={prod.id} className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-brand-green transition-colors cursor-pointer group">
            <div className="w-16 h-16 rounded-xl bg-white dark:bg-black/50 overflow-hidden flex-shrink-0 p-1">
              <img src={prod.imagen_url || prod.img} alt={prod.nombre} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h5 className="text-[11px] font-bold text-gray-900 dark:text-white line-clamp-1">{prod.nombre}</h5>
              <span className="text-xs font-black text-brand-green">S/ {Number(prod.precio || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
