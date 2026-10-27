
import { useState, useMemo, useEffect } from 'react';
import Avatar3D, { type BodyScales } from './Avatar3D';
import { useAuth } from '../../context/AuthContext';

interface AvatarStageProps {
  selectedProduct: any;
  genero: 'Hombre' | 'Mujer';
  activeSize: string;
  onSelectSize: (talla: string) => void;
  customColor?: string | null;
  onSelectColor?: (color: string | null) => void;
}

const STANDARD_SIZES = ['S', 'M', 'L'] as const;

// Escala neutral: la talla elegida no debe modificar el cuerpo.
// El ajuste de cada talla se implementará en la geometría de la ropa.

const BASE_BODY_SCALES: BodyScales = {
  scalePecho: 1,
  scaleCintura: 1,
  scaleCadera: 1,
  scaleMuslo: 1,
  scaleHombros: 1,
  scaleBrazo: 1,
  scaleAltura: 1,
};

// Adaptar la complexión según el perfil guardado.
const BODY_TYPE_SCALES: Record<string, BodyScales> = {
  delgado: {
    scalePecho: 0.88,
    scaleCintura: 0.88,
    scaleCadera: 0.92,
    scaleMuslo: 0.90,
    scaleHombros: 0.94,
    scaleBrazo: 0.90,
    scaleAltura: 1,
  },
  medio: BASE_BODY_SCALES,
  ancho: {
    scalePecho: 1.12,
    scaleCintura: 1.12,
    scaleCadera: 1.08,
    scaleMuslo: 1.10,
    scaleHombros: 1.10,
    scaleBrazo: 1.10,
    scaleAltura: 1,
  },
};
// Colores disponibles según el producto seleccionado.
function getAvailableProductColors(
  product: any
): { name: string; hex: string; bg: string }[] {
  if (!product) {
    return [
      { name: 'Original Catálogo', hex: 'original', bg: '#121316' },
    ];
  }

  const name = (product.nombre || '').toLowerCase();

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

  if (
    name.includes('yoga') &&
    (name.includes('tank') || name.includes('crop') || name.includes('top'))
  ) {
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

  if (
    name.includes('tiro') ||
    name.includes('challenger') ||
    name.includes('unstoppable') ||
    name.includes('pro 365')
  ) {
    return [
      { name: 'Negro Deportivo Oficial', hex: '#121316', bg: '#121316' },
      { name: 'Gris Carbón', hex: '#374151', bg: '#374151' },
    ];
  }

  if (product.color) {
    return [
      {
        name: `Color Oficial (${product.color})`,
        hex: 'original',
        bg: '#121316',
      },
    ];
  }

  return [
    { name: 'Color Oficial de Catálogo', hex: 'original', bg: '#121316' },
  ];
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
  const { user } = useAuth();
  const [tipoCuerpo, setTipoCuerpo] = useState('medio');

  const [cameraAction, setCameraAction] = useState<{
    type: 'reset' | 'zoom-in' | 'zoom-out' | 'rotate-left' | 'rotate-right';
    id: number;
  } | null>(null);

  const activeColor =
    externalCustomColor !== undefined ? externalCustomColor : internalColor;

  const availableColors = useMemo(
    () => getAvailableProductColors(selectedProduct),
    [selectedProduct]
  );

  const setColor = (color: string | null) => {
    setInternalColor(color);
    onSelectColor?.(color);
  };

  // Leer el tipo de cuerpo guardado en el perfil.
  useEffect(() => {
    if (!user?.id) {
      setTipoCuerpo('medio');
      return;
    }

    const savedType = localStorage.getItem(`fitlook_tipo_cuerpo_${user.id}`);
    if (
      savedType &&
      ['delgado', 'medio', 'ancho'].includes(savedType)
    ) {
      setTipoCuerpo(savedType);
    } else {
      setTipoCuerpo('medio');
    }
  }, [user?.id]);

  // Restablecer el color al cambiar de producto.
  useEffect(() => {
    setColor(null);
    // Se mantiene la sincronización con el ID del producto.
  }, [selectedProduct?.id]);

  const normSize: 'S' | 'M' | 'L' = activeSize.trim().toUpperCase() === 'S' ? 'S'
  : activeSize.trim().toUpperCase() === 'L'? 'L': 'M';

  // La talla seleccionada no cambia las dimensiones corporales.
  const currentScales = BASE_BODY_SCALES;

  // Variantes y stock de la talla seleccionada.
  const productSizes = useMemo(() => {
    return selectedProduct?.producto_tallas || selectedProduct?.tallas || [];
  }, [selectedProduct]);

  const activeVariant = useMemo(() => {
    return productSizes.find(
      (variant: any) =>
        String(variant.talla).trim().toUpperCase() === normSize
    );
  }, [productSizes, normSize]);

  const activeStock = activeVariant
    ? Number(activeVariant.stock ?? 0)
    : 0;

  const isOutOfStock = !activeVariant || activeStock <= 0;

  const triggerCam = (
    type: 'reset' | 'zoom-in' | 'zoom-out' | 'rotate-left' | 'rotate-right'
  ) => {
    setCameraAction({ type, id: Date.now() });
  };

  return (
    <div className="relative flex flex-col h-full w-full items-center justify-center rounded-[2.5rem] border border-gray-200/60 dark:border-white/10 shadow-[inset_0_0_80px_rgba(16,185,129,0.04)] overflow-hidden bg-gradient-to-b from-white/40 via-transparent to-brand-green/5 dark:from-white/[0.02]">

      {/* Compatibilidad: no se muestra un porcentaje sin cálculo real. */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
        <div className="bg-black/75 dark:bg-black/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl flex items-center gap-3 max-w-md animate-fade-in pointer-events-auto">
          <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 text-xs font-black">
            ?
          </div>

          <div className="text-left">
            <div className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Compatibilidad pendiente</span>
              <span className="text-[9px] text-brand-green font-bold">
                · Talla {normSize}
              </span>
            </div>

            <div className="text-[10px] text-gray-300 line-clamp-2">
              Selecciona tu talla. El ajuste real requiere comparar tus medidas
              con las medidas de la prenda.
            </div>
          </div>
        </div>
      </div>

      {/* Iluminación decorativa central. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-72 h-[30rem] bg-brand-green/10 blur-3xl rounded-full" />
      </div>

      {/* Selector de talla y color. */}
      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-auto flex flex-wrap items-center justify-between gap-2 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-lg">

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Talla:
          </span>

          <div className="flex items-center gap-1">
            {STANDARD_SIZES.map((size) => {
              const isSelected = size === normSize;

              const variant = productSizes.find(
                (item: any) =>
                  String(item.talla).trim().toUpperCase() === size
              );

              const hasStock = variant && Number(variant.stock) > 0;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSelectSize(size)}
                  title={
                    variant
                      ? hasStock
                        ? `Talla ${size}: ${variant.stock} disponibles`
                        : `Talla ${size}: Agotado`
                      : `Talla ${size}`
                  }
                  aria-pressed={isSelected}
                  className={`min-w-8 h-8 px-2 rounded-xl text-xs font-black transition-all cursor-pointer relative ${isSelected
                      ? 'bg-brand-green text-black ring-2 ring-brand-green/80 shadow-md scale-105'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                    }`}
                >
                  {size}

                  {variant && !hasStock && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-zinc-900"
                      title="Agotado"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-white/10 pt-1.5 sm:pt-0 sm:pl-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-1 hidden sm:inline">
            Color:
          </span>

          {availableColors.map((swatch) => {
            const isActive =
              activeColor === swatch.hex ||
              (!activeColor && swatch.hex === availableColors[0]?.hex);

            return (
              <button
                key={swatch.name}
                type="button"
                title={swatch.name}
                aria-label={`Seleccionar ${swatch.name}`}
                aria-pressed={isActive}
                onClick={() =>
                  setColor(swatch.hex === 'original' ? null : swatch.hex)
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isActive
                    ? 'bg-brand-green/20 text-brand-green border-brand-green ring-1 ring-brand-green'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm"
                  style={{ background: swatch.bg }}
                />
                <span className="text-[10px] hidden sm:inline">
                  {swatch.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Disponibilidad de inventario. */}
      {selectedProduct && (
        <div className="absolute top-[82px] left-4 right-4 z-20 pointer-events-none flex justify-center">
          {isOutOfStock ? (
            <div className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold backdrop-blur-md shadow-sm flex items-center gap-1.5 animate-fade-in">
              <i className="fa-solid fa-triangle-exclamation text-amber-500" />
              <span>
                Talla <strong>{normSize}</strong> sin stock disponible · Modo
                visualización 3D
              </span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold backdrop-blur-md shadow-sm flex items-center gap-1.5 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Talla <strong>{normSize}</strong> disponible ({activeStock}{' '}
                unidades en stock)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Controles de cámara. */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl">
        <button
          type="button"
          onClick={() => triggerCam('reset')}
          title="Reiniciar vista de cámara"
          aria-label="Reiniciar cámara"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gray-100 dark:bg-white/10 hover:bg-brand-green hover:text-black transition-all cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <i className="fa-solid fa-rotate-left" />
        </button>

        <button
          type="button"
          onClick={() => triggerCam('zoom-in')}
          title="Acercar"
          aria-label="Acercar cámara"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gray-100 dark:bg-white/10 hover:bg-brand-green hover:text-black transition-all cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <i className="fa-solid fa-magnifying-glass-plus" />
        </button>

        <button
          type="button"
          onClick={() => triggerCam('zoom-out')}
          title="Alejar"
          aria-label="Alejar cámara"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gray-100 dark:bg-white/10 hover:bg-brand-green hover:text-black transition-all cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <i className="fa-solid fa-magnifying-glass-minus" />
        </button>

        <button
          type="button"
          onClick={() => triggerCam('rotate-left')}
          title="Girar a la izquierda"
          aria-label="Girar a la izquierda"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gray-100 dark:bg-white/10 hover:bg-brand-green hover:text-black transition-all cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <i className="fa-solid fa-arrow-rotate-left" />
        </button>

        <button
          type="button"
          onClick={() => triggerCam('rotate-right')}
          title="Girar a la derecha"
          aria-label="Girar a la derecha"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-gray-100 dark:bg-white/10 hover:bg-brand-green hover:text-black transition-all cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <i className="fa-solid fa-arrow-rotate-right" />
        </button>
      </div>

      {/* Visor 3D. */}
      <div className="relative w-full h-full flex items-center justify-center z-10">
        <Avatar3D
          scales={currentScales}
          genero={genero}
          selectedProduct={selectedProduct}
          activeSize={normSize}
          customColor={activeColor || undefined}
          cameraAction={cameraAction}
        />
      </div>

      {/* Miniatura de la prenda seleccionada. */}
      {selectedProduct && (
        <div className="absolute bottom-10 left-4 z-20 flex max-w-[min(18rem,calc(100%-2rem))] items-center gap-3 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-2.5 shadow-xl backdrop-blur">
          <img
            src={
              selectedProduct.imagen_url ||
              selectedProduct.imagenUrl ||
              selectedProduct.img ||
              'https://placehold.co/120x120'
            }
            alt={selectedProduct.nombre || selectedProduct.name || 'Prenda seleccionada'}
            className="h-12 w-12 rounded-xl bg-white object-contain border border-gray-100 dark:border-white/5"
          />

          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
              Prenda en prueba
            </p>

            <p className="truncate text-xs font-extrabold text-gray-900 dark:text-white">
              {selectedProduct.nombre || selectedProduct.name}
            </p>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-brand-green font-black">
                Talla {normSize}
              </span>

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

      <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-400 dark:text-gray-500 pointer-events-none mx-auto w-max z-20 font-medium">
        Arrastra para rotar 360° · Rueda del ratón para zoom
      </div>
    </div>
  );
}
