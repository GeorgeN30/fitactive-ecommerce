import { getCatalogOffer, type CatalogProduct } from "../services/catalog";
import { formatSoles } from "../utils/money";

export default function ProductOffer({ product, selectedSize, compact = false }: { product: CatalogProduct; selectedSize?: string | null; compact?: boolean }) {
  const offer = getCatalogOffer(product, selectedSize);
  return <div className="min-w-0 max-w-full space-y-1 my-3 break-words" aria-label="Precio del producto">
    {offer.discount > 0 && <p className="text-xs font-bold text-emerald-700 dark:text-brand-green">-{offer.discount}% · {offer.endsAt ? "Oferta por tiempo limitado" : "Producto en descuento"}</p>}
    <div className={compact ? "flex flex-col items-start gap-1 font-black text-base leading-tight tabular-nums" : "flex flex-wrap items-baseline gap-x-2 gap-y-1 font-black text-lg tabular-nums"}>
      {offer.discount > 0 && <span className={`${compact ? "text-xs" : "text-sm"} whitespace-nowrap font-normal text-gray-500 line-through`}>{formatSoles(product.precio)}</span>}
      {offer.from && <span className="text-xs font-medium text-gray-500">Desde</span>}
      <span className="whitespace-nowrap">{formatSoles(offer.price)}</span>
    </div>
    {offer.discount > 0 && offer.endsAt && <p className="text-xs text-gray-500">Hasta {new Date(offer.endsAt).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" })} (Perú)</p>}
    {offer.discount > 0 && !selectedSize && <p className="text-xs text-gray-500">Tallas en oferta: {offer.sizes.join(", ")}</p>}
  </div>;
}
