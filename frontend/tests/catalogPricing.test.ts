import { describe, expect, it } from "vitest";
import { getCatalogPrice, type CatalogProduct } from "../src/services/catalog";
import { formatSoles } from "../src/utils/money";

function product(sizes: CatalogProduct["tallas"]): CatalogProduct {
  return {
    id: "product-1",
    nombre: "Polo Run",
    descripcion: null,
    categoria: "Running",
    marca: null,
    precio: 100,
    imagenUrl: null,
    genero: null,
    tallas: sizes,
    totalStock: sizes.reduce((total, size) => total + size.stock, 0),
  };
}

describe("catalog pricing", () => {
  it("shows the cheapest available size rather than an out-of-stock discount", () => {
    const result = getCatalogPrice(product([
      { id: "s", talla: "S", stock: 0, discountPercent: 40, salePrice: 60 },
      { id: "m", talla: "M", stock: 3, discountPercent: 20, salePrice: 80 },
      { id: "l", talla: "L", stock: 2, discountPercent: 0, salePrice: 100 },
    ]));

    expect(result).toEqual({ price: 80, discount: 20 });
    expect(formatSoles(result.price)).toBe("S/ 80.00");
  });

  it("falls back to the base price when no size is available", () => {
    expect(getCatalogPrice(product([
      { id: "s", talla: "S", stock: 0, discountPercent: 30, salePrice: 70 },
    ]))).toEqual({ price: 100, discount: 0 });
  });
});
