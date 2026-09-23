import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
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
});
