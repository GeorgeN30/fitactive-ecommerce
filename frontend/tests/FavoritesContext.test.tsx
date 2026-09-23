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

describe("FavoritesContext session lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("token", "active-session");
  });

  it("clears favorites when the session is closed", () => {
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

  it("does not restore favorites after reload without a session", () => {
    localStorage.removeItem("token");
    localStorage.setItem(
      "favorites",
      JSON.stringify([
        { id: "real-1", cat: "Running", name: "Polo", price: 80, img: "/polo.png" },
      ]),
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(result.current.favorites).toEqual([]);
    expect(localStorage.getItem("favorites")).toBeNull();
  });
});
