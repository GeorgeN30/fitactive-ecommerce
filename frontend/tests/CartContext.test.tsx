import { beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { CartProvider, useCart } from "../src/context/CartContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe("CartContext startup", () => {
  beforeEach(() => localStorage.clear());

  it("recovers from malformed cart JSON", () => {
    localStorage.setItem("fitactive-cart", "{broken-json");
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cartItems).toEqual([]);
    expect(result.current.cartTotal).toBe(0);
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
});
