import api from "./api";

export interface CatalogSize {
  id: string;
  talla: string;
  stock: number;
  discountPercent: number;
  salePrice: number;
}

export interface CatalogProduct {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  precio: number;
  imagenUrl: string | null;
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
  const cheapest = available.reduce((best, size) =>
    size.salePrice < best.salePrice ? size : best,
  );
  return { price: cheapest.salePrice, discount: cheapest.discountPercent };
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  const { data } = await api.get("/products");
  return (data.products || data.data || data) as CatalogProduct[];
}
