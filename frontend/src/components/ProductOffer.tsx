import { getCatalogOffer, type CatalogProduct } from "../services/catalog";
import { formatSoles } from "../utils/money";

export default function ProductOffer({ product, selectedSize }: { product: CatalogProduct; selectedSize?: string | null }) {
  const offer = getCatalogOffer(product, selectedSize);
  return <div className="space-y-1 my-3" aria-label="Precio del producto">
    {offer.discount > 0 && <p className="text-xs font-bold text-emerald-700 dark:text-brand-green">-{offer.discount}% · {offer.endsAt ? "Oferta por tiempo limitado" : "Producto en descuento"}</p>}
    <div className="font-black text-lg">{offer.discount > 0 && <span className="text-sm font-normal text-gray-500 line-through mr-2">{formatSoles(product.precio)}</span>}{offer.from && <span className="text-sm mr-1">Desde</span>}<span>{formatSoles(offer.price)}</span></div>
    {offer.discount > 0 && offer.endsAt && <p className="text-xs text-gray-500">Hasta {new Date(offer.endsAt).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" })} (Perú)</p>}
    {offer.discount > 0 && !selectedSize && <p className="text-xs text-gray-500">Tallas en oferta: {offer.sizes.join(", ")}</p>}
  </div>;
}
