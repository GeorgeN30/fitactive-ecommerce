import React from 'react';
import { PRODUCTS_PER_PAGE, paginateProducts } from '../../pages/ProbadorVirtual';

interface ProductSelectorProps {
  productos: any[];
  visibleProducts: any[];
  selectedProduct: any;
  setSelectedProduct: (p: any) => void;
  genero: string;
  handleCambioGenero: (g: string) => void;
  categoriaFiltro: string;
  setCategoriaFiltro: (c: string) => void;
  categoriasUnicas: string[];
}

export default function ProductSelector({ 
  productos, visibleProducts, selectedProduct, setSelectedProduct, 
  genero, handleCambioGenero, categoriaFiltro, setCategoriaFiltro, categoriasUnicas 
}: ProductSelectorProps) {
  
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Category Dropdown */}
      <div className="relative w-full">
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="appearance-none w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-green/50 cursor-pointer transition-all"
        >
          {categoriasUnicas.map(cat => (
            <option key={cat} value={cat} className="text-gray-900 bg-white">
              {cat}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Gender Toggle (from Mockup) */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 p-1 bg-gray-50 dark:bg-black/20">
        {['Hombre', 'Mujer'].map(g => (
          <button
            key={g}
            onClick={() => handleCambioGenero(g)}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${genero === g ? 'bg-brand-green text-black shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'}`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {visibleProducts.map(prod => (
          <button
            key={prod.id}
            onClick={() => setSelectedProduct(prod)}
            className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-300 bg-white dark:bg-white/5 cursor-pointer ${selectedProduct?.id === prod.id ? 'border-brand-green shadow-lg ring-1 ring-brand-green' : 'border-gray-100 dark:border-white/5 hover:border-brand-green/50'}`}
          >
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-black/40 mb-3 relative">
              <img src={prod.imagen_url || prod.img} alt={prod.nombre} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-2" />
              {selectedProduct?.id === prod.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-brand-green text-black rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </div>
            <h5 className="text-[10px] font-bold text-gray-900 dark:text-white text-center line-clamp-1">{prod.nombre}</h5>
            <span className="text-xs font-black text-brand-green mt-1">S/ {Number(prod.precio || 0).toFixed(2)}</span>
          </button>
        ))}
      </div>

      {visibleProducts.length === 0 && (
        <div className="text-center py-10 text-gray-500 font-bold text-sm bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          No hay prendas disponibles.
        </div>
      )}

      {/* Mockup Elements: Color & Size (Dynamic UI for demonstration) */}
      <div className="mt-4 border-t border-gray-100 dark:border-white/5 pt-6">
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Color</h4>
        <div className="flex gap-3">
          {[
            { id: 'negro', hex: '#1a1a1a' },
            { id: 'gris', hex: '#6b7280' },
            { id: 'verde', hex: '#15803d' },
            { id: 'rosa', hex: '#db2777' },
          ].map(color => {
            const isSelected = selectedProduct?.colorHex === color.hex || selectedProduct?.color?.toLowerCase() === color.id;
            return (
              <button 
                key={color.id}
                onClick={() => setSelectedProduct({...selectedProduct, colorHex: color.hex, color: color.id})}
                className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                  isSelected 
                  ? 'border-brand-green ring-2 ring-brand-green/30 scale-110' 
                  : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-2">
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Talla</h4>
        <div className="flex gap-2">
          {['XS', 'S', 'M', 'L'].map(t => (
            <button 
              key={t} 
              onClick={() => setSelectedProduct({...selectedProduct, talla_sugerida: t})}
              className={`w-9 h-9 rounded-lg text-xs font-black border transition-all ${
                t === (selectedProduct?.talla_sugerida || 'M') 
                ? 'bg-brand-green text-black border-brand-green' 
                : 'bg-white text-gray-700 border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/20'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
