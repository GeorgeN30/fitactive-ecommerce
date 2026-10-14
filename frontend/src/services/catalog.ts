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

export function getCatalogPrice(product: CatalogProduct): CatalogPrice {
  const available = product.tallas.filter((size) => size.stock > 0);
  if (available.length === 0) return { price: product.precio, discount: 0 };
  return available.map((size) => getSizePrice(product, size)).reduce((best, price) => price.price < best.price ? price : best);
}

export function getSizePrice(product: CatalogProduct, size: CatalogSize): CatalogPrice {
  const now = Date.now();
  if ((size.discountStartsAt && Date.parse(size.discountStartsAt) > now) ||
      (size.discountEndsAt && Date.parse(size.discountEndsAt) <= now)) return { price: product.precio, discount: 0 };
  return { price: size.salePrice, discount: size.discountPercent };
}

export function getCatalogOffer(product: CatalogProduct, selectedSize?: string | null) {
  const available = product.tallas.filter((size) => size.stock > 0);
  const chosen = selectedSize ? product.tallas.find((size) => size.talla === selectedSize)
    : available.reduce<CatalogSize | undefined>((best, size) => !best || getSizePrice(product, size).price < getSizePrice(product, best).price ? size : best, undefined);
  const pricing = chosen ? getSizePrice(product, chosen) : { price: product.precio, discount: 0 };
  return { ...pricing, endsAt: pricing.discount > 0 ? chosen?.discountEndsAt : null,
    from: !selectedSize && new Set(available.map((size) => getSizePrice(product, size).price)).size > 1,
    sizes: available.filter((size) => getSizePrice(product, size).discount > 0).map((size) => size.talla) };
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  const { data } = await api.get("/products");
  return (data.products || data.data || data) as CatalogProduct[];
}
