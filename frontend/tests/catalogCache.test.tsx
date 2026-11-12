import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import api from "../src/services/api";
import { fetchCatalogProducts, getCachedCatalogProducts, invalidateCatalogCache, type CatalogProduct } from "../src/services/catalog";
import { useCatalog } from "../src/hooks/useCatalog";

vi.mock("../src/services/api", () => ({ default: { get: vi.fn() } }));

const product: CatalogProduct = {
  id: "p1", nombre: "Polo", precio: 100, descripcion: null, categoria: "Running",
  marca: "FitActive", genero: "Hombre", imagenUrl: null, totalStock: 2,
  tallas: [{ id: "m1", talla: "M", stock: 2, discountPercent: 0, salePrice: 100 }],
};

beforeEach(() => {
  vi.resetAllMocks();
  invalidateCatalogCache();
  vi.mocked(api.get).mockResolvedValue({ data: { products: [product] } });
});
afterEach(() => vi.useRealTimers());

describe("shared catalog requests", () => {
  it("deduplicates concurrent header and page requests", async () => {
    const [header, page] = await Promise.all([
      fetchCatalogProducts({ cached: true }), fetchCatalogProducts({ cached: true }),
    ]);
    expect(api.get).toHaveBeenCalledExactlyOnceWith("/products");
    expect(header).toBe(page);
    expect(getCachedCatalogProducts()).toBe(page);
  });

  it("reuses browsing data for at most fifteen seconds", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-11-11T12:00:00Z");
    vi.setSystemTime(now);
    await fetchCatalogProducts({ cached: true });
    vi.setSystemTime(now.getTime() + 14_999);
    await fetchCatalogProducts({ cached: true });
    expect(api.get).toHaveBeenCalledTimes(1);
    vi.setSystemTime(now.getTime() + 15_000);
    await fetchCatalogProducts({ cached: true });
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("bypasses the browsing cache for cart validation and explicit refresh", async () => {
    await fetchCatalogProducts({ cached: true });
    const updated = { ...product, precio: 120, totalStock: 0, tallas: [] };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { products: [updated] } });
    expect(await fetchCatalogProducts()).toEqual([updated]);
    expect(getCachedCatalogProducts()).toEqual([updated]);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("does not cache request failures and allows an immediate retry", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("offline"));
    await expect(fetchCatalogProducts({ cached: true })).rejects.toThrow("offline");
    expect(getCachedCatalogProducts()).toBeUndefined();
    expect(await fetchCatalogProducts({ cached: true })).toEqual([product]);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("supports explicit invalidation", async () => {
    await fetchCatalogProducts({ cached: true });
    invalidateCatalogCache();
    expect(getCachedCatalogProducts()).toBeUndefined();
    await fetchCatalogProducts({ cached: true });
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});

describe("warm catalog navigation", () => {
  it("renders an existing catalog without another blocking loading screen", async () => {
    await fetchCatalogProducts({ cached: true });
    const { result } = renderHook(() => useCatalog());
    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([product]);
    await act(async () => {});
    expect(api.get).toHaveBeenCalledTimes(1);
    await act(async () => { await result.current.refresh(); });
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("keeps known products visible and reports background refresh failure", async () => {
    await fetchCatalogProducts({ cached: true });
    const { result } = renderHook(() => useCatalog());
    await act(async () => {});
    vi.mocked(api.get).mockRejectedValueOnce(new Error("offline"));
    await act(async () => { await result.current.refresh(); });
    await waitFor(() => expect(result.current.error).toContain("No se pudo actualizar"));
    expect(result.current.products).toEqual([product]);
    expect(result.current.loading).toBe(false);
  });
});
