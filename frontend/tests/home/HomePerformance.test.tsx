import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

const state = vi.hoisted(() => ({
  user: null as null | { role: string; preferencia_deporte?: string },
  products: Array.from({ length: 8 }, (_, index) => ({
    id: `product-${index + 1}`,
    nombre: `Producto ${index + 1}`,
    descripcion: index === 5 ? "running" : "",
    categoria: "General",
    precio: 100,
    imagenUrl: `https://example.com/product-${index + 1}.jpg`,
    tallas: [],
    totalStock: index === 7 ? 0 : 1,
  })),
}));

vi.mock("../../src/context/AuthContext", () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock("../../src/hooks/useCatalog", () => ({ useCatalog: () => ({ products: state.products, loading: false, error: "" }) }));
vi.mock("../../src/components/AppLayout", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("../../src/components/FavoriteButton", () => ({ default: () => null }));
vi.mock("../../src/components/ProductOffer", () => ({ default: () => null }));

import HomePage from "../../src/pages/HomePage";

function renderHome() {
  return render(<MemoryRouter><HomePage /></MemoryRouter>);
}

describe("Home image loading", () => {
  afterEach(() => {
    state.user = null;
    state.products.forEach((product, index) => { product.imagenUrl = `https://example.com/product-${index + 1}.jpg`; });
    vi.useRealTimers();
  });

  it("requests only the active responsive hero and advances manually and on its timer", () => {
    vi.useFakeTimers();
    const { container } = renderHome();
    const hero = container.querySelector('img[alt=""]')!;
    expect(hero).toHaveAttribute("fetchpriority", "high");
    expect(screen.getByRole("button", { name: "Mostrar imagen 1" })).toHaveAttribute("aria-pressed", "true");
    expect(hero).toHaveAttribute("sizes", "100vw");
    expect(hero.getAttribute("srcset")).toContain("w=640&auto=format&fit=crop 640w");
    expect(hero.getAttribute("srcset")).toContain("w=2070&auto=format&fit=crop 2070w");
    expect(hero.getAttribute("src")).toContain("photo-1517963879433");
    expect(container.querySelectorAll('img[alt=""]')).toHaveLength(1);
    expect(container.innerHTML).not.toContain("photo-1552674605");
    expect(container.innerHTML).not.toContain("photo-1571019613454");

    fireEvent.click(screen.getByRole("button", { name: "Mostrar imagen 2" }));
    expect(screen.getByRole("button", { name: "Mostrar imagen 2" })).toHaveAttribute("aria-pressed", "true");
    expect(hero.getAttribute("src")).toContain("photo-1552674605");
    expect(hero.getAttribute("srcset")).toContain("photo-1552674605");
    expect(hero).toHaveAttribute("fetchpriority", "auto");
    expect(container.querySelectorAll('img[alt=""]')).toHaveLength(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(hero.getAttribute("src")).toContain("photo-1571019613454");
  });

  it("keeps personalized featured images eager and only lazy-loads more products without reordering", () => {
    state.user = { role: "customer", preferencia_deporte: "running" };
    renderHome();
    expect(screen.getByText("Según tus preferencias")).toBeInTheDocument();
    const featured = screen.getByText("Según tus preferencias").closest("section")!;
    const more = screen.getByText("Más productos").closest("section")!;
    const featuredImages = within(featured).getAllByRole("img");
    const moreImages = within(more).getAllByRole("img");
    expect(featuredImages.map((image) => image.getAttribute("alt"))).toEqual(["Producto 6", "Producto 1", "Producto 2", "Producto 3"]);
    expect(moreImages.map((image) => image.getAttribute("alt"))).toEqual(["Producto 4", "Producto 5", "Producto 7"]);
    featuredImages.forEach((image) => expect(image).not.toHaveAttribute("loading", "lazy"));
    moreImages.forEach((image) => {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveAttribute("decoding", "async");
      expect(image).toHaveAttribute("width", "96");
      expect(image).toHaveAttribute("height", "96");
      expect(image.getAttribute("src")).toBe(`https://example.com/product-${image.getAttribute("alt")!.split(" ")[1]}.jpg`);
    });
  });

  it("falls back once to the original without changing the product link and resets for a new image", () => {
    const original = "https://assets.adidas.com/images/w_500,f_auto,q_auto/first.jpg";
    const next = "https://assets.adidas.com/images/w_500,f_auto,q_auto/second.jpg";
    state.products[0].imagenUrl = original;
    state.products[4].imagenUrl = original;
    state.products[1].imagenUrl = "";
    const { rerender } = renderHome();
    let image = screen.getByRole("img", { name: "Producto 1" });
    expect(image).toHaveAttribute("src", original.replace("w_500", "w_480"));
    expect(image.closest("a")).toHaveAttribute("href", "/producto/product-1");
    expect(image).not.toHaveAttribute("srcset");
    expect(screen.getByRole("img", { name: "Producto 5" })).toHaveAttribute("src", original.replace("w_500", "w_192"));
    expect(screen.getByRole("img", { name: "Producto 2" }).getAttribute("src")).toContain("images.unsplash.com/photo-1542291026");
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", original);
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", original);
    expect(image.closest("a")).toHaveAttribute("href", "/producto/product-1");

    state.products[0].imagenUrl = next;
    rerender(<MemoryRouter><HomePage /></MemoryRouter>);
    image = screen.getByRole("img", { name: "Producto 1" });
    expect(image).toHaveAttribute("src", next.replace("w_500", "w_480"));
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", next);
  });
});
