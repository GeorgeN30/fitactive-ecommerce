import api from "./api";

export interface CatalogSize {
  id: string;
  talla: string;
  stock: number;
  discountPercent: number;
  salePrice: number;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  rangoCmMin?: number | null;
  rangoCmMax?: number | null;
}

export interface CatalogProduct {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  precio: number;
  imagenUrl: string | null;
  imageUrls?: string[];
  genero: string | null;
  tallas: CatalogSize[];
  totalStock: number;
}

export interface CatalogPrice {
  price: number;
  discount: number;
}

export function getSizePrice(product: CatalogProduct, size: CatalogSize): CatalogPrice {
  const basePrice = Number(product.precio) || 0;
  const now = Date.now();

  const startsAt = size.discountStartsAt ? Date.parse(size.discountStartsAt) : null;
  const endsAt = size.discountEndsAt ? Date.parse(size.discountEndsAt) : null;
  const isStarted = !startsAt || (!isNaN(startsAt) && startsAt <= now);
  const isNotExpired = !endsAt || (!isNaN(endsAt) && endsAt > now);

  const rawPercent = Math.round(Number(size.discountPercent) || 0);
  const rawSalePrice = Number(size.salePrice);

  const hasValidPercent = rawPercent > 0 && rawPercent < 100;

  if (isStarted && isNotExpired && hasValidPercent) {
    let finalSalePrice =
      !isNaN(rawSalePrice) && rawSalePrice > 0 && rawSalePrice < basePrice
        ? Math.round(rawSalePrice * 100) / 100
        : Math.round(basePrice * (1 - rawPercent / 100) * 100) / 100;

    const calculatedDiscount = Math.round(((basePrice - finalSalePrice) / basePrice) * 100);

    if (calculatedDiscount > 0 && calculatedDiscount < 100 && finalSalePrice < basePrice) {
      return { price: finalSalePrice, discount: calculatedDiscount };
    }
  }

  return { price: basePrice, discount: 0 };
}

export function getCatalogPrice(product: CatalogProduct): CatalogPrice {
  const available = (product.tallas || []).filter((size) => Number(size.stock) > 0);
  if (available.length === 0) return { price: Number(product.precio) || 0, discount: 0 };
  return available
    .map((size) => getSizePrice(product, size))
    .reduce((best, price) => (price.price < best.price ? price : best));
}

export function getCatalogOffer(product: CatalogProduct, selectedSize?: string | null) {
  const available = (product.tallas || []).filter((size) => Number(size.stock) > 0);
  const chosen = selectedSize
    ? (product.tallas || []).find((size) => String(size.talla).trim().toUpperCase() === String(selectedSize).trim().toUpperCase())
    : available.reduce<CatalogSize | undefined>(
        (best, size) => (!best || getSizePrice(product, size).price < getSizePrice(product, best).price ? size : best),
        undefined
      );

  const pricing = chosen ? getSizePrice(product, chosen) : { price: Number(product.precio) || 0, discount: 0 };

  return {
    ...pricing,
    endsAt: pricing.discount > 0 ? chosen?.discountEndsAt : null,
    from: !selectedSize && new Set(available.map((size) => getSizePrice(product, size).price)).size > 1,
    sizes: available.filter((size) => getSizePrice(product, size).discount > 0).map((size) => size.talla),
  };
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  const { data } = await api.get("/products");
  const rawList = ((data.products || data.data || data) as CatalogProduct[]) || [];

  // Filter only products configured for Hombre or Mujer
  return rawList.filter((p) => {
    const gen = (p.genero || "").trim().toLowerCase();
    return (
      !gen ||
      gen === "hombre" ||
      gen === "mujer" ||
      gen === "male" ||
      gen === "female" ||
      gen === "masculino" ||
      gen === "femenino" ||
      gen === "unisex"
    );
  });
}
