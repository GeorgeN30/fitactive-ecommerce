import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  FavoritesProvider,
  useFavorites,
} from "../src/context/FavoritesContext";
import { SESSION_CLEARED_EVENT } from "../src/utils/session";

function wrapper({ children }: { children: React.ReactNode }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}

describe("FavoritesContext persistence and lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("persists and restores favorites across reloads for any user (guest or logged-in)", () => {
    localStorage.setItem(
      "favorites",
      JSON.stringify([
        { id: "real-1", cat: "Running", name: "Polo", price: 80, img: "/polo.png" },
      ]),
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].id).toBe("real-1");
    expect(result.current.isFavorite("real-1")).toBe(true);
  });

  it("adds and toggles favorites without creating duplicates", () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => {
      result.current.addFavorite({
        id: "prod-10",
        cat: "Polos",
        name: "Nike Dri-FIT",
        price: 99,
        img: "/img.png",
      });
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.isFavorite("prod-10")).toBe(true);

    // Duplicate add should not add again
    act(() => {
      result.current.addFavorite({
        id: "prod-10",
        cat: "Polos",
        name: "Nike Dri-FIT",
        price: 99,
        img: "/img.png",
      });
    });
    expect(result.current.favorites).toHaveLength(1);

    // Toggle off
    act(() => {
      result.current.toggleFavorite({
        id: "prod-10",
        cat: "Polos",
        name: "Nike Dri-FIT",
        price: 99,
        img: "/img.png",
      });
    });
    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.isFavorite("prod-10")).toBe(false);
  });

  it("clears favorites when session is explicitly closed", () => {
    localStorage.setItem(
      "favorites",
      JSON.stringify([
        { id: "real-1", cat: "Running", name: "Polo", price: 80, img: "/polo.png" },
      ]),
    );
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => {
      window.dispatchEvent(new Event(SESSION_CLEARED_EVENT));
    });

    expect(result.current.favorites).toEqual([]);
    expect(localStorage.getItem("favorites")).toBeNull();
  });
});
