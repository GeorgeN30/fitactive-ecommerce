import { useEffect, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const avatar = vi.hoisted(() => ({ mount: vi.fn(), unmount: vi.fn() }));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../src/components/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../src/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: null }),
}));
vi.mock("../src/context/CartContext", () => ({
  CartProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useCart: () => ({ addToCart: vi.fn() }),
}));
vi.mock("../src/context/FavoritesContext", () => ({
  FavoritesProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useFavorites: () => ({ isFavorite: () => false }),
}));
vi.mock("../src/context/StoreSettingsContext", () => ({
  StoreSettingsProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useStoreSettings: () => ({}),
}));
vi.mock("../src/services/api", () => ({
  default: { get: vi.fn(), post: vi.fn().mockResolvedValue({ data: {} }) },
}));
vi.mock("../src/components/ProbadorVirtual/AvatarStage", () => ({
  default: function MockAvatarStage({ selectedProduct, activeSize, customColor }: {
    selectedProduct: { id: string } | null;
    activeSize: string;
    customColor: string | null;
  }) {
    useEffect(() => {
      avatar.mount();
      return () => { avatar.unmount(); };
    }, []);
    return <output data-testid="avatar-stage">{JSON.stringify({ product: selectedProduct?.id, activeSize, customColor })}</output>;
  },
}));

import App from "../src/App";
import api from "../src/services/api";
import { invalidateCatalogCache, type CatalogProduct } from "../src/services/catalog";

function product(id: string, overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id,
    nombre: `Reebok Vector ${id}`,
    descripcion: null,
    categoria: "Running",
    marca: "Reebok",
    precio: 100,
    imagenUrl: `/test-${id}.jpg`,
    genero: "Hombre",
    tallas: ["S", "M", "L"].map((talla) => ({
      id: `${id}-${talla}`, talla, stock: 10, discountPercent: 20, salePrice: 80,
    })),
    totalStock: 30,
    ...overrides,
  };
}

function expectSingleFetch() {
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(api.get).toHaveBeenCalledWith("/products");
}

describe("App query navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateCatalogCache();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url !== "/products") throw new Error(`Unexpected API request: ${url}`);
      return { data: [
        product("first"),
        product("second"),
        product("other-category", { categoria: "Training" }),
        product("women", { genero: "Mujer" }),
        product("other-brand", { genero: "Mujer", marca: "Nike" }),
        product("full-price", {
          genero: "Mujer",
          tallas: [{ id: "full-M", talla: "M", stock: 10, discountPercent: 0, salePrice: 100 }],
        }),
      ] } as never;
    });
  });

  afterEach(() => {
    cleanup();
    invalidateCatalogCache();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("selects a garment on the same pathname without remounting the avatar or resetting size and filters", async () => {
    window.history.replaceState(null, "", "/probador-virtual?producto=first&talla=L");
    const user = userEvent.setup();
    render(<App />);
    const selector = await screen.findByRole("group", { name: "Selector de prendas" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Filtrar por categoría" }), "Running");
    await user.type(screen.getByPlaceholderText("Buscar por prenda o marca..."), "Vector");
    const stage = screen.getByTestId("avatar-stage");
    expect(avatar.mount).toHaveBeenCalledTimes(1);

    // A warm cache must not conceal a route remount and its extra /products request.
    invalidateCatalogCache();
    await user.click(within(selector).getByAltText("Reebok Vector second"));

    await waitFor(() => expect(stage).toHaveTextContent('"product":"second"'));
    expect(window.location.pathname).toBe("/probador-virtual");
    expect(new URLSearchParams(window.location.search).get("producto")).toBe("second");
    expect(new URLSearchParams(window.location.search).get("talla")).toBe("L");
    expect(screen.getByTestId("avatar-stage")).toBe(stage);
    expect(stage).toHaveTextContent('"activeSize":"L"');
    expect(screen.getByRole("button", { name: "Probar talla L" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: "Filtrar por categoría" })).toHaveValue("Running");
    expect(screen.getByPlaceholderText("Buscar por prenda o marca...")).toHaveValue("Vector");
    expect(avatar.mount).toHaveBeenCalledTimes(1);
    expect(avatar.unmount).not.toHaveBeenCalled();
    expectSingleFetch();
  });

  it("updates the size query without remounting the avatar or losing its custom color and local filters", async () => {
    window.history.replaceState(null, "", "/probador-virtual?producto=first&talla=M");
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("group", { name: "Selector de prendas" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Filtrar por categoría" }), "Running");
    await user.type(screen.getByPlaceholderText("Buscar por prenda o marca..."), "Vector");
    await user.click(screen.getByRole("button", { name: "Previsualizar color Azul marino" }));
    const stage = screen.getByTestId("avatar-stage");

    invalidateCatalogCache();
    await user.click(screen.getByRole("button", { name: "Probar talla S" }));

    expect(new URLSearchParams(window.location.search).get("talla")).toBe("S");
    expect(new URLSearchParams(window.location.search).get("producto")).toBe("first");
    expect(screen.getByTestId("avatar-stage")).toBe(stage);
    expect(JSON.parse(stage.textContent!)).toEqual({ product: "first", activeSize: "S", customColor: "#172554" });
    expect(screen.getByRole("button", { name: "Probar talla S" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: "Filtrar por categoría" })).toHaveValue("Running");
    expect(screen.getByPlaceholderText("Buscar por prenda o marca...")).toHaveValue("Vector");
    expect(avatar.mount).toHaveBeenCalledTimes(1);
    expect(avatar.unmount).not.toHaveBeenCalled();
    expectSingleFetch();
  });

  it("keeps the new gender and garment when changing size after a gender switch", async () => {
    window.history.replaceState(null, "", "/probador-virtual?producto=first&talla=M");
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("group", { name: "Selector de prendas" });
    await user.click(screen.getAllByRole("button", { name: "Mujer", exact: true })[0]);
    await waitFor(() => expect(screen.getByTestId("avatar-stage")).toHaveTextContent('"product":"women"'));
    expect(new URLSearchParams(window.location.search).get("producto")).toBe("women");
    await user.click(screen.getByRole("button", { name: "Probar talla S" }));
    expect(JSON.parse(screen.getByTestId("avatar-stage").textContent!)).toEqual({ product: "women", activeSize: "S", customColor: null });
    expect(new URLSearchParams(window.location.search).get("producto")).toBe("women");
    expect(avatar.mount).toHaveBeenCalledTimes(1);
    expectSingleFetch();
  });

  it("preserves catalog brand, stock, size and sort across gender and offers query navigation without refetching", async () => {
    window.history.replaceState(null, "", "/catalogo?genero=Hombre");
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Reebok Vector first" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Filtrar por marca" }), "Reebok");
    await user.click(screen.getByRole("checkbox", { name: "Filtrar productos en stock" }));
    await user.click(screen.getByRole("button", { name: "M", exact: true }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Ordenar productos" }), "low");

    invalidateCatalogCache();
    await user.click(screen.getByRole("button", { name: "Mujer", exact: true }));

    expect(new URLSearchParams(window.location.search).get("genero")).toBe("Mujer");
    expect(screen.getByRole("heading", { name: "Reebok Vector women" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Reebok Vector first" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Reebok Vector other-brand" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrar por marca" })).toHaveValue("Reebok");
    expect(screen.getByRole("checkbox", { name: "Filtrar productos en stock" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "M", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: "Ordenar productos" })).toHaveValue("low");
    expectSingleFetch();

    await user.selectOptions(screen.getByRole("combobox", { name: "Filtrar por categoría" }), "Running");
    expect(screen.getByRole("heading", { name: "Reebok Vector full-price" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Solo productos en descuento" }));

    expect(new URLSearchParams(window.location.search).get("ofertas")).toBe("1");
    expect(new URLSearchParams(window.location.search).get("genero")).toBe("Mujer");
    expect(screen.getByRole("checkbox", { name: "Solo productos en descuento" })).toBeChecked();
    expect(screen.getByRole("heading", { name: "Reebok Vector women" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Reebok Vector full-price" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrar por categoría" })).toHaveValue("Running");
    expect(screen.getByRole("combobox", { name: "Filtrar por marca" })).toHaveValue("Reebok");
    expect(screen.getByRole("checkbox", { name: "Filtrar productos en stock" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "M", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: "Ordenar productos" })).toHaveValue("low");
    expectSingleFetch();
  });
});
