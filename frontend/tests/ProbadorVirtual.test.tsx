import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

vi.mock("../src/components/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../src/components/ProbadorVirtual/AvatarStage", () => ({
  default: ({ activeSize, customColor }: { activeSize: string; customColor?: string | null }) => <output data-testid="avatar-stage">{JSON.stringify({ activeSize, customColor })}</output>,
}));

vi.mock("../src/services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: null, updateProfile: vi.fn() }),
}));

const cart = vi.hoisted(() => ({ addToCart: vi.fn() }));
vi.mock("../src/context/CartContext", () => ({
  useCart: () => cart,
}));
vi.mock("../src/context/FavoritesContext", () => ({ useFavorites: () => ({ addFavorite: vi.fn() }) }));

import ProbadorVirtual from "../src/pages/ProbadorVirtual";
import { paginateProducts, PRODUCTS_PER_PAGE } from "../src/utils/productPagination";
import api from "../src/services/api";

interface TestProduct {
  id: string;
  nombre: string;
  genero: string;
  categoria: string;
  producto_tallas: { id: string; talla: string; stock: number; discountPercent: number; salePrice: number }[];
  tallas: { id: string; talla: string; stock: number; discountPercent: number; salePrice: number }[];
  precio: number;
  totalStock: number;
  imagenUrl: string;
}

function createProducts(count: number): TestProduct[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `product-${index + 1}`,
    nombre: `Prenda ${index + 1}`,
    genero: "Hombre",
    categoria: "Running",
    producto_tallas: [],
    tallas: [],
    precio: 100,
    totalStock: 0,
    imagenUrl: `https://example.com/product-${index + 1}.jpg`,
  }));
}

describe("ProbadorVirtual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("paginates product collections in groups of five", () => {
    const products = Array.from({ length: 30 }, (_, index) => index + 1);

    expect(PRODUCTS_PER_PAGE).toBe(5);
    expect(paginateProducts(products, 1)).toEqual([1, 2, 3, 4, 5]);
    expect(paginateProducts(products, 6)).toEqual([26, 27, 28, 29, 30]);
    expect(paginateProducts(products, 0)).toEqual([1, 2, 3, 4, 5]);
  });

  it("preserves the existing five garment limit without pagination to hidden products", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: createProducts(30) } as never);

    render(
      <MemoryRouter>
        <ProbadorVirtual />
      </MemoryRouter>,
    );

    const selector = await screen.findByRole("group", { name: "Selector de prendas" });
    expect(within(selector).getByAltText("Prenda 1")).toBeInTheDocument();
    expect(within(selector).getByAltText("Prenda 5")).toBeInTheDocument();
    expect(within(selector).getByAltText("Prenda 1").getAttribute("src")).toBe("https://example.com/product-1.jpg");
    expect(within(selector).queryByAltText("Prenda 6")).not.toBeInTheDocument();
    expect(screen.getByText("Mostrando 1-5 de 5 prendas")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Prendas siguientes" })).not.toBeInTheDocument();
  });

  it("keeps sizes, preview colors and fit information together in the product panel", async () => {
    const products = createProducts(2);
    products[0].nombre = "Reebok Vector";
    products[0].tallas = ["S", "M", "L"].map((size) => ({ id: size, talla: size, stock: 15, discountPercent: 0, salePrice: 100 }));
    products[0].totalStock = 45;
    vi.mocked(api.get).mockResolvedValue({ data: products } as never);
    const user = userEvent.setup();
    render(<MemoryRouter><ProbadorVirtual /></MemoryRouter>);
    const panel = await screen.findByRole("complementary", { name: "Opciones de la prenda" });
    expect(await within(panel).findByRole("group", { name: "Tallas de la prenda" })).toBeInTheDocument();
    expect(within(panel).getByRole("heading", { name: "Sobre el ajuste" })).toBeInTheDocument();
    expect(within(panel).getByText(/Previsualización 3D aproximada/)).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "Probar talla L" }));
    expect(within(panel).getByRole("button", { name: "Probar talla L" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(panel).getByRole("button", { name: "Previsualizar color Azul marino" }));
    expect(JSON.parse(screen.getByTestId("avatar-stage").textContent!)).toEqual({ activeSize: "L", customColor: "#172554" });
    await user.click(within(panel).getByRole("button", { name: "Añadir al Carrito" }));
    expect(cart.addToCart).toHaveBeenCalledWith(expect.objectContaining({ size: "L", color: "Original" }));
    const selector = screen.getByRole("group", { name: "Selector de prendas" });
    await user.click(within(selector).getByAltText("Prenda 2"));
    expect(JSON.parse(screen.getByTestId("avatar-stage").textContent!).customColor).toBeNull();
    expect(within(panel).queryByRole("button", { name: "Previsualizar color Azul marino" })).not.toBeInTheDocument();
  });
});
