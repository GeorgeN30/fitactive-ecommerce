import React from 'react';
import ProductOffer from '../ProductOffer';

interface ProductSelectorProps {
  visibleProducts: any[];
  selectedProduct: any;
  setSelectedProduct: (p: any) => void;
  genero: string;
  handleCambioGenero: (g: string) => void;
  categoriaFiltro: string;
  setCategoriaFiltro: (c: string) => void;
  categoriasUnicas: string[];
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalProducts: number;
  firstProductIndex: number;
  lastProductIndex: number;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export default function ProductSelector({
  visibleProducts,
  selectedProduct,
  setSelectedProduct,
  genero,
  handleCambioGenero,
  categoriaFiltro,
  setCategoriaFiltro,
  categoriasUnicas,
  currentPage,
  pageCount,
  onPageChange,
  totalProducts,
  firstProductIndex,
  lastProductIndex,
  searchTerm = '',
  onSearchChange,
}: ProductSelectorProps) {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Switch de Género (Hombre / Mujer) */}
      <div className="flex rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 p-1 bg-gray-50 dark:bg-black/30">
        {(['Hombre', 'Mujer'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => handleCambioGenero(g)}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-200 cursor-pointer ${
              genero === g
                ? 'bg-brand-green text-black shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {g === 'Hombre' ? 'Hombre' : 'Mujer'}
          </button>
        ))}
      </div>

      {/* Filtro por Categoría */}
      <div className="relative w-full">
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          aria-label="Filtrar por categoría"
          className="appearance-none w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl px-3.5 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-green/50 cursor-pointer transition-all"
        >
          {categoriasUnicas.map((cat) => (
            <option key={cat} value={cat} className="text-gray-900 bg-white dark:bg-zinc-900 dark:text-white">
              {cat === 'Todas' ? 'Todas las categorías' : cat}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Buscador Rápido opcional */}
      {onSearchChange && (
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por prenda o marca..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-xl px-3.5 py-2 pl-8 focus:outline-none focus:ring-2 focus:ring-brand-green/50"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400"><i className="fa-solid fa-magnifying-glass"></i></span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      )}

      {/* Grid de Prendas del Catálogo */}
      <div role="group" aria-label="Selector de prendas" className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {visibleProducts.map((prod) => {
            const isSelected = selectedProduct?.id === prod.id;
            const img = prod.imagen_url || prod.imagenUrl || prod.img || 'https://placehold.co/200x200';
            const availableSizes = (prod.producto_tallas || prod.tallas || [])
              .filter((t: any) => Number(t.stock) > 0)
              .map((t: any) => t.talla)
              .join(', ');

            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => setSelectedProduct(prod)}
                className={`flex flex-col items-center p-2.5 rounded-2xl border-2 transition-all duration-200 bg-white dark:bg-white/5 cursor-pointer text-left relative ${
                  isSelected
                    ? 'border-brand-green shadow-md ring-1 ring-brand-green bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'border-gray-100 dark:border-white/5 hover:border-brand-green/40'
                }`}
              >
                <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-gray-50 dark:bg-black/40 mb-2 relative flex items-center justify-center">
                  <img
                    src={img}
                    alt={prod.nombre}
                    className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-1.5 transition-transform duration-200 hover:scale-105"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-brand-green text-black rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {prod.totalStock === 0 && (
                    <span className="absolute bottom-1 left-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                      AGOTADO
                    </span>
                  )}
                </div>

                <div className="w-full">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block truncate">
                    {prod.marca || prod.categoria || 'Catálogo'}
                  </span>
                  <h5 className="text-[11px] font-black text-gray-900 dark:text-white line-clamp-1 mt-0.5">
                    {prod.nombre}
                  </h5>
                  <div className="text-[10px] mt-1">
                    <ProductOffer product={prod} />
                  </div>
                  {availableSizes && (
                    <span className="text-[9px] text-gray-400 block truncate mt-1">
                      Tallas: <strong className="text-gray-600 dark:text-gray-300">{availableSizes}</strong>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {visibleProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500 font-bold text-xs bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            No hay prendas disponibles para este filtro.
          </div>
        )}

        {totalProducts > 0 && (
          <p className="text-center text-[11px] font-bold text-gray-400 mt-1">
            Mostrando {firstProductIndex}-{lastProductIndex} de {totalProducts} prendas
          </p>
        )}

        {/* Paginación */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-3 mt-1">
            <button
              type="button"
              aria-label="Prendas anteriores"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-xl border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold disabled:opacity-30 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Anterior
            </button>
            <span className="text-xs font-bold text-gray-500">
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              aria-label="Prendas siguientes"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pageCount}
              className="rounded-xl border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold disabled:opacity-30 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
