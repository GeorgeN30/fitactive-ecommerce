import { useState, useMemo, useEffect } from 'react';
import Avatar3D, { type BodyScales } from './Avatar3D';

interface AvatarStageProps {
  selectedProduct: any;
  genero: 'Hombre' | 'Mujer';
  activeSize: string;
  onSelectSize: (talla: string) => void;
  customColor?: string | null;
  onSelectColor?: (color: string | null) => void;
}

const STANDARD_SIZES = ['S', 'M', 'L', 'XS', 'XL', 'XXL'];
const CORE_SIZES = ['S', 'M', 'L'];

// Escalas antropométricas MakeHuman estándar proporcionales por talla (0 distorsión)
export const FIT_COMPATIBILITY_INFO: Record<string, { label: string; score: number; desc: string }> = {
  S: { label: 'Entalle Atlético (Slim Fit)', score: 96, desc: 'Ajuste ergonómico al cuerpo sin exceso de tela' },
  M: { label: 'Entalle Estándar (Regular Fit)', score: 99, desc: 'Caída de confección oficial con proporción ideal' },
  L: { label: 'Entalle Confort (Relaxed Fit)', score: 95, desc: 'Mayor holgura y comodidad para movimiento libre' },
  XS: { label: 'Entalle Ceñido (Tight Fit)', score: 94, desc: 'Silueta compacta de compresión atlética' },
  XL: { label: 'Entalle Amplio (Loose Fit)', score: 93, desc: 'Volumen amplio con caída relajada' },
  XXL: { label: 'Entalle Extra Amplio (Oversized)', score: 91, desc: 'Corte holgado de máxima cobertura' },
};

const STANDARD_SIZE_SCALES: Record<string, BodyScales> = {
  XS: {
    scalePecho: 0.88,
    scaleCintura: 0.88,
    scaleCadera: 0.88,
    scaleMuslo: 0.88,
    scaleHombros: 0.88,
    scaleBrazo: 0.88,
    scaleAltura: 0.98,
  },
  S: {
    scalePecho: 0.94,
    scaleCintura: 0.94,
    scaleCadera: 0.94,
    scaleMuslo: 0.94,
    scaleHombros: 0.94,
    scaleBrazo: 0.94,
    scaleAltura: 0.99,
  },
  M: {
    scalePecho: 1.0,
    scaleCintura: 1.0,
    scaleCadera: 1.0,
    scaleMuslo: 1.0,
    scaleHombros: 1.0,
    scaleBrazo: 1.0,
    scaleAltura: 1.0,
  },
  L: {
    scalePecho: 1.06,
    scaleCintura: 1.06,
    scaleCadera: 1.06,
    scaleMuslo: 1.06,
    scaleHombros: 1.06,
    scaleBrazo: 1.06,
    scaleAltura: 1.01,
  },
  XL: {
    scalePecho: 1.13,
    scaleCintura: 1.13,
    scaleCadera: 1.13,
    scaleMuslo: 1.13,
    scaleHombros: 1.13,
    scaleBrazo: 1.13,
    scaleAltura: 1.02,
  },
  XXL: {
    scalePecho: 1.20,
    scaleCintura: 1.20,
    scaleCadera: 1.20,
    scaleMuslo: 1.20,
    scaleHombros: 1.20,
    scaleBrazo: 1.20,
    scaleAltura: 1.03,
  },
};

// Colores reales auténticos del catálogo oficial de cada prenda
function getAvailableProductColors(product: any): { name: string; hex: string; bg: string }[] {
  if (!product) return [{ name: 'Original Catálogo', hex: 'original', bg: '#121316' }];

  const name = (product.nombre || '').toLowerCase();
  const desc = (product.descripcion || '').toLowerCase();

  // 1. Prendas oficiales con colores específicos certificados de packshot
  if (name.includes('legend') || (name.includes('nike') && name.includes('polo'))) {
    return [
      { name: 'Blanco Óptico Oficial', hex: '#f4f5f7', bg: '#f4f5f7' },
      { name: 'Negro Anthracite', hex: '#121316', bg: '#121316' },
    ];
  }
  if (name.includes('alate')) {
    return [
      { name: 'Espresso Brown Oficial', hex: '#442a22', bg: '#442a22' },
      { name: 'Negro Classic', hex: '#121316', bg: '#121316' },
    ];
  }
  if (name.includes('yoga') && (name.includes('tank') || name.includes('crop') || name.includes('top'))) {
    return [
      { name: 'Terracota Coral Oficial', hex: '#a94c42', bg: '#a94c42' },
      { name: 'Negro Studio', hex: '#121316', bg: '#121316' },
    ];
  }
  if (name.includes('vector') || name.includes('reebok')) {
    return [
      { name: 'Negro & Vector Blanco Oficial', hex: '#121316', bg: '#121316' },
      { name: 'Azul Marino & Vector', hex: '#172554', bg: '#172554' },
    ];
  }
  if (name.includes('tiro') || name.includes('challenger') || name.includes('unstoppable') || name.includes('pro 365')) {
    return [
      { name: 'Negro Deportivo Oficial', hex: '#121316', bg: '#121316' },
      { name: 'Gris Carbón', hex: '#374151', bg: '#374151' },
    ];
  }

  // 2. Colores explícitos del producto si existen en la BD
  if (product.color) {
    return [{ name: `Color Oficial (${product.color})`, hex: 'original', bg: '#121316' }];
  }

  // 3. Original Catálogo (sin inventar paletas de fantasía)
  return [{ name: 'Color Oficial de Catálogo', hex: 'original', bg: '#121316' }];
}

export default function AvatarStage({
  selectedProduct,
  genero,
  activeSize,
  onSelectSize,
  customColor: externalCustomColor,
  onSelectColor,
}: AvatarStageProps) {
  const [internalColor, setInternalColor] = useState<string | null>(null);
  const [cameraAction, setCameraAction] = useState<{
    type: 'reset' | 'zoom-in' | 'zoom-out' | 'rotate-left' | 'rotate-right';
    id: number;
  } | null>(null);

  const activeColor = externalCustomColor !== undefined ? externalCustomColor : internalColor;
  const availableColors = useMemo(() => getAvailableProductColors(selectedProduct), [selectedProduct]);

  const setColor = (c: string | null) => {
    setInternalColor(c);
    onSelectColor?.(c);
  };

  // Reset color al cambiar de prenda
  useEffect(() => {
    setColor(null);
  }, [selectedProduct?.id]);

  // Escala normalizada según la talla estándar activa
  const normSize = (activeSize || 'M').trim().toUpperCase();
  const currentScales = STANDARD_SIZE_SCALES[normSize] || STANDARD_SIZE_SCALES['M'];

  // Variantes del producto y stock de la talla actual
  const productSizes = useMemo(() => {
    return selectedProduct?.producto_tallas || selectedProduct?.tallas || [];
  }, [selectedProduct]);

  const activeVariant = useMemo(() => {
    return productSizes.find((v: any) => String(v.talla).trim().toUpperCase() === normSize);
  }, [productSizes, normSize]);

  const activeStock = activeVariant ? Number(activeVariant.stock ?? 0) : 0;
  const isOutOfStock = !activeVariant || activeStock <= 0;

  const triggerCam = (type: 'reset' | 'zoom-in' | 'zoom-out' | 'rotate-left' | 'rotate-right') => {
    setCameraAction({ type, id: Date.now() });
  };

  return (
    <div className="relative flex flex-col h-full w-full items-center justify-center rounded-[2.5rem] border border-gray-200/60 dark:border-white/10 shadow-[inset_0_0_80px_rgba(16,185,129,0.04)] overflow-hidden bg-gradient-to-b from-white/40 via-transparent to-brand-green/5 dark:from-white/[0.02]">
      {/* Indicador de Compatibilidad y Entalle (HU-018) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
        <div className="bg-black/75 dark:bg-black/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl flex items-center gap-3 max-w-md animate-fade-in pointer-events-auto">
          <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-brand-green/20 text-brand-green text-xs font-black">
            {FIT_COMPATIBILITY_INFO[normSize]?.score || 98}%
          </div>
          <div className="text-left">
            <div className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>{FIT_COMPATIBILITY_INFO[normSize]?.label || 'Ajuste Anatómico Estándar'}</span>
              <span className="text-[9px] text-brand-green font-bold">· Talla {normSize}</span>
            </div>
            <div className="text-[10px] text-gray-300 line-clamp-1">
              {FIT_COMPATIBILITY_INFO[normSize]?.desc || 'Ajuste coordinado proporcional'}
            </div>
          </div>
        </div>
      </div>

      {/* Glow estético central */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-72 h-[30rem] bg-brand-green/10 blur-3xl rounded-full"></div>
      </div>

      {/* Barra Superior Inteligente: Selector de Tallas Estándar y Paleta de Colores */}
      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-auto flex flex-wrap items-center justify-between gap-2 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-lg">
        {/* Selector Directo de Talla Estándar (XS - XXL) */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Talla:
          </span>
          <div className="flex items-center gap-1">
            {STANDARD_SIZES.map((sz) => {
              const isSelected = sz === normSize;
              const variant = productSizes.find((v: any) => String(v.talla).trim().toUpperCase() === sz);
              const hasStock = variant && Number(variant.stock) > 0;

              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onSelectSize(sz)}
                  title={variant ? (hasStock ? `Talla ${sz}: ${variant.stock} disponibles` : `Talla ${sz}: Agotado`) : `Talla ${sz}`}
                  className={`min-w-8 h-8 px-2 rounded-xl text-xs font-black transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-brand-green text-black ring-2 ring-brand-green/80 shadow-md scale-105'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  {sz}
                  {variant && !hasStock && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-zinc-900" title="Agotado" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Paleta de Colores Textiles Deportivos */}
        <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-white/10 pt-1.5 sm:pt-0 sm:pl-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-1 hidden sm:inline">
            Color:
          </span>
          {availableColors.map((swatch) => {
            const isActive = activeColor === swatch.hex || (!activeColor && swatch.hex === availableColors[0]?.hex);
            return (
              <button
                key={swatch.name}
                type="button"
                title={swatch.name}
                onClick={() => setColor(swatch.hex === 'original' ? null : swatch.hex)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-brand-green/20 text-brand-green border-brand-green ring-1 ring-brand-green'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-white/20'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm" style={{ background: swatch.bg }} />
                <span className="text-[10px] hidden sm:inline">{swatch.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerta de Inventario en Vivo para la Talla Seleccionada */}
      {selectedProduct && (
        <div className="absolute top-[82px] left-4 right-4 z-20 pointer-events-none flex justify-center">
          {isOutOfStock ? (
            <div className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold backdrop-blur-md shadow-sm flex items-center gap-1.5 animate-fade-in">
              <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
              <span>Talla <strong>{normSize}</strong> agotada en inventario · Modo visualización 3D</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold backdrop-blur-md shadow-sm flex items-center gap-1.5 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Talla <strong>{normSize}</strong> disponible ({activeStock} unidades en stock)</span>
            </div>
          )}
        </div>
      )}

      {/* Controles de Cámara 3D Flotantes (Reset, Zoom +/-, Rotar) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl">
        <button type="button" onClick={() => triggerCam('reset')} title="Reiniciar vista de cámara" className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gray-100 dark:bg-white/10 hover:bg-brand-green hover:text-black transition-all cursor-pointer text-gray-700 dark:text-gray-300"><i className="fa-solid fa-rotate-left"></i></button>
        <button type="button" onClick={() => triggerCam('zoom-in')} title="Acercar (Zoom In)" className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gray-100 dark:bg-white/10 hover:bg-brand-green hover:text-black transition-all cursor-pointer text-gray-700 dark:text-gray-300"><i className="fa-solid fa-magnifying-glass-plus"></i></button>
        <button type="button" onClick={() => triggerCam('zoom-out')} title="Alejar (Zoom Out)" className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gray-100 dark:bg-white/10 hover:bg-brand-green hover:text-black transition-all cursor-pointer text-gray-700 dark:text-gray-300"><i className="fa-solid fa-magnifying-glass-minus"></i></button>
        <button type="button" onClick={() => triggerCam('rotate-left')} title="Girar a la izquierda" className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gray-100 dark:bg-white/10 hover:bg-brand-green hover:text-black transition-all cursor-pointer text-gray-700 dark:text-gray-300"><i className="fa-solid fa-arrow-rotate-left"></i></button>
        <button type="button" onClick={() => triggerCam('rotate-right')} title="Girar a la derecha" className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gray-100 dark:bg-white/10 hover:bg-brand-green hover:text-black transition-all cursor-pointer text-gray-700 dark:text-gray-300"><i className="fa-solid fa-arrow-rotate-right"></i></button>
      </div>

      {/* Visor Three.js con Avatar 3D Centrado Horizontalmente */}
      <div className="relative w-full h-full flex items-center justify-center z-10">
        <Avatar3D
          scales={currentScales}
          genero={genero}
          selectedProduct={selectedProduct}
          fitStatus="perfecto"
          fitDelta={0}
          customColor={activeColor || undefined}
          cameraAction={cameraAction}
        />
      </div>

      {/* Miniatura de la Prenda Seleccionada en la esquina inferior izquierda */}
      {selectedProduct && (
        <div className="absolute bottom-10 left-4 z-20 flex max-w-[min(18rem,calc(100%-2rem))] items-center gap-3 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-2.5 shadow-xl backdrop-blur">
          <img
            src={selectedProduct.imagen_url || selectedProduct.imagenUrl || selectedProduct.img || 'https://placehold.co/120x120'}
            alt=""
            className="h-12 w-12 rounded-xl bg-white object-contain border border-gray-100 dark:border-white/5"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Prenda en prueba</p>
            <p className="truncate text-xs font-extrabold text-gray-900 dark:text-white">
              {selectedProduct.nombre || selectedProduct.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-brand-green font-black">Talla {normSize}</span>
              {activeColor && (
                <span
                  className="inline-block w-3 h-3 rounded-full border border-white/40 shadow-xs"
                  style={{ backgroundColor: activeColor }}
                  title="Color activo"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Indicador inferior de interacción */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-400 dark:text-gray-500 pointer-events-none mx-auto w-max z-20 font-medium">
        Arrastra para rotar 360° · Rueda del ratón para zoom
      </div>
    </div>
  );
}
