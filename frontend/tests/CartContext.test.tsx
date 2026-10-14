import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../src/services/catalog", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/services/catalog")>()), fetchCatalogProducts: vi.fn() }));
import { fetchCatalogProducts } from "../src/services/catalog";
import { CartProvider, useCart } from "../src/context/CartContext";
import { SESSION_CLEARED_EVENT } from "../src/utils/session";

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe("CartContext startup", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("token", "active-session");
  });

  it("recovers from malformed cart JSON", () => {
    localStorage.setItem("fitactive-cart", "{broken-json");
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cartItems).toEqual([]);
    expect(result.current.cartTotal).toBe(0);
  });

  it("revalidates expired prices and insufficient stock instead of trusting storage", async () => {
    localStorage.setItem("fitactive-cart", JSON.stringify([{ id: "p1", name: "Polo", price: 80, img: "", tallaId: "s1", size: "M", quantity: 2, stock: 10 }]));
    vi.mocked(fetchCatalogProducts).mockResolvedValue([{ id: "p1", nombre: "Polo", precio: 100, descripcion: null, categoria: null, marca: null, genero: null, imagenUrl: null, totalStock: 1, tallas: [{ id: "s1", talla: "M", stock: 1, salePrice: 80, discountPercent: 20, discountEndsAt: "2020-01-01T00:00:00Z" }] }]);
    const { result } = renderHook(() => useCart(), { wrapper });
    await act(async () => { expect(await result.current.revalidateCart()).toEqual({ changed: true, unavailable: true }); });
    expect(result.current.cartItems[0].price).toBe(100);
    expect(result.current.cartItems[0].stock).toBe(1);
    expect(result.current.cartTotal).toBe(200);
  });

  it("ignores invalid stored lines instead of crashing price calculations", () => {
    localStorage.setItem("fitactive-cart", JSON.stringify([
      { id: "real-1", name: "Polo", img: "/polo.png", price: 80, quantity: 2, size: "M" },
      { id: "bad-1", name: "Bad", img: "/bad.png", price: "Infinity", quantity: 1 },
      { id: "bad-2", name: "Bad", img: "/bad.png", price: 20, quantity: -4 },
    ]));
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartTotal).toBe(160);
  });

  it("clears the cart when the session is closed", () => {
    localStorage.setItem(
      "fitactive-cart",
      JSON.stringify([
        { id: "real-1", name: "Polo", img: "/polo.png", price: 80, quantity: 1 },
      ]),
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      window.dispatchEvent(new Event(SESSION_CLEARED_EVENT));
    });

    expect(result.current.cartItems).toEqual([]);
    expect(localStorage.getItem("fitactive-cart")).toBeNull();
  });

  it("does not restore a cart after reload without a session", () => {
    localStorage.removeItem("token");
    localStorage.setItem(
      "fitactive-cart",
      JSON.stringify([
        { id: "real-1", name: "Polo", img: "/polo.png", price: 80, quantity: 1 },
      ]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.cartItems).toEqual([]);
    expect(localStorage.getItem("fitactive-cart")).toBeNull();
  });

  it("caps added and updated quantities at the known stock", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        id: "stocked-1",
        name: "Polo",
        img: "/polo.png",
        price: 80,
        quantity: 7,
        size: "M",
        stock: 3,
      });
    });

    expect(result.current.cartItems[0].quantity).toBe(3);

    act(() => {
      result.current.updateQuantity("stocked-1", 99, "M");
    });

    expect(result.current.cartItems[0].quantity).toBe(3);
  });

  it("removes only the purchased snapshot when a checkout is completed", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        id: "stocked-1",
        name: "Polo",
        img: "/polo.png",
        price: 80,
        quantity: 2,
        size: "M",
        tallaId: "size-m",
        stock: 5,
      });
    });
    act(() => result.current.registerPendingCheckout("order-1"));
    act(() => {
      result.current.addToCart({
        id: "stocked-1",
        name: "Polo",
        img: "/polo.png",
        price: 80,
        quantity: 1,
        size: "M",
        tallaId: "size-m",
        stock: 5,
      });
    });
    act(() => result.current.completePendingCheckout("order-1"));

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].quantity).toBe(1);
    expect(localStorage.getItem("fitlook:pending-checkout")).toBeNull();
  });

  it("does not clear the cart for a different order", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addToCart({
        id: "stocked-1",
        name: "Polo",
        img: "/polo.png",
        price: 80,
        quantity: 1,
      });
    });
    act(() => result.current.registerPendingCheckout("order-1"));
    act(() => result.current.completePendingCheckout("order-2"));
    expect(result.current.cartItems).toHaveLength(1);
  });
});
