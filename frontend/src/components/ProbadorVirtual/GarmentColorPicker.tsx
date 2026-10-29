interface GarmentColorPickerProps {
  product: { nombre?: string };
  value: string | null;
  onChange: (color: string | null) => void;
}

export default function GarmentColorPicker({ product, value, onChange }: GarmentColorPickerProps) {
  const name = (product.nombre || '').toLowerCase();
  let colors: { name: string; hex: string }[] = [];

  // These are preview palettes, not purchasable catalog variants.
  if (name.includes('legend') || (name.includes('nike') && name.includes('polo'))) {
    colors = [{ name: 'Blanco', hex: '#f4f5f7' }, { name: 'Negro', hex: '#121316' }];
  } else if (name.includes('alate')) {
    colors = [{ name: 'Marrón', hex: '#442a22' }, { name: 'Negro', hex: '#121316' }];
  } else if (name.includes('yoga') && /tank|crop|top/.test(name)) {
    colors = [{ name: 'Terracota', hex: '#a94c42' }, { name: 'Negro', hex: '#121316' }];
  } else if (name.includes('vector') || name.includes('reebok')) {
    colors = [{ name: 'Negro', hex: '#121316' }, { name: 'Azul marino', hex: '#172554' }];
  } else if (/tiro|challenger|unstoppable|pro 365/.test(name)) {
    colors = [{ name: 'Negro', hex: '#121316' }, { name: 'Gris', hex: '#374151' }];
  }

  return (
    <fieldset className="min-w-0 space-y-2.5">
      <legend className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Color de la vista 3D
      </legend>
      <div className="flex min-w-0 flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={value === null}
          onClick={() => onChange(null)}
          className={`max-w-full cursor-pointer rounded-xl border px-3 py-2 text-left text-xs font-semibold leading-relaxed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${value === null ? 'border-brand-green bg-brand-green/10 text-gray-900 dark:text-white' : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'}`}
        >
          Color del catálogo
        </button>
        {colors.map((color) => (
          <button
            key={color.hex}
            type="button"
            aria-label={`Previsualizar color ${color.name}`}
            aria-pressed={value === color.hex}
            onClick={() => onChange(color.hex)}
            className={`inline-flex max-w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold leading-relaxed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${value === color.hex ? 'border-brand-green bg-brand-green/10 text-gray-900 dark:text-white' : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'}`}
          >
            <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }} />
            <span className="min-w-0 break-words">{color.name}</span>
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
        {colors.length > 0
          ? 'Los colores alternativos solo cambian la previsualización, no el producto de tu pedido.'
          : 'Esta prenda se muestra con el color de referencia del catálogo.'}
      </p>
    </fieldset>
  );
}
