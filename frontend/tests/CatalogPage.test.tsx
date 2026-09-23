import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

vi.mock("../src/components/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../src/context/FavoritesContext", () => ({
  useFavorites: vi.fn(),
}));

vi.mock("../src/services/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/services/catalog")>()),
  fetchCatalogProducts: vi.fn(),
}));

import CatalogPage from "../src/pages/CatalogPage";
import { AuthProvider } from "../src/context/AuthContext";
import { useFavorites } from "../src/context/FavoritesContext";
import { fetchCatalogProducts } from "../src/services/catalog";
import type { CatalogProduct } from "../src/services/catalog";

function createProducts(count: number): CatalogProduct[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `product-${index + 1}`,
    nombre: `Producto ${index + 1}`,
    descripcion: "Producto de prueba",
    categoria: "Running",
    marca: "FitActive",
    precio: 100 + index,
    imagenUrl: `https://example.com/product-${index + 1}.jpg`,
    genero: "Hombre",
    tallas: [{
      id: `size-${index + 1}`,
      talla: "M",
      stock: 10,
      discountPercent: 0,
      salePrice: 100 + index,
    }],
    totalStock: 10,
  }));
}

describe("CatalogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFavorites).mockReturnValue({
      favorites: [],
      toggleFavorite: vi.fn(),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
    });
  });

  it("shows six products per page and groups pagination buttons by five", async () => {
    vi.mocked(fetchCatalogProducts).mockResolvedValue(createProducts(180));
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <CatalogPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Producto 1")).toBeInTheDocument();
    expect(screen.getByText(/Mostrando/)).toHaveTextContent("6");
    expect(screen.getByText(/Mostrando/)).toHaveTextContent("180");
    expect(screen.getByRole("navigation", { name: "Paginación del catálogo" }).textContent?.replace(/\s+/g, " ").trim()).toBe("Anterior12345SiguientePágina 1 de 30");
    expect(screen.getAllByRole("button", { name: /^Página [1-5]$/ })).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "30", exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Productos anteriores" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Productos siguientes" }));

    expect(screen.getByText("Producto 7")).toBeInTheDocument();
    expect(screen.queryByText("Producto 1")).not.toBeInTheDocument();
    expect(screen.getByText(/Página 2 de 30/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Página 5" }));
    await user.click(screen.getByRole("button", { name: "Productos siguientes" }));

    expect(screen.getByText("Producto 31")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Página (6|7|8|9|10)$/ })).toHaveLength(5);
  });
});
