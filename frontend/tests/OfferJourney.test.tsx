import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
vi.mock("../src/components/AppLayout", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "customer1", role: "customer" } }) }));
vi.mock("../src/context/FavoritesContext", () => ({ useFavorites: () => ({ isFavorite: () => false, toggleFavorite: vi.fn() }) }));
const { addToCart } = vi.hoisted(() => ({ addToCart: vi.fn() }));
vi.mock("../src/context/CartContext", () => ({ useCart: () => ({ addToCart }) }));
vi.mock("../src/services/catalog", async (importOriginal) => ({ ...(await importOriginal<typeof import("../src/services/catalog")>()), fetchCatalogProducts: vi.fn() }));
import { fetchCatalogProducts, type CatalogProduct } from "../src/services/catalog";
import ProductDetailPage from "../src/pages/ProductDetailPage";
import CatalogPage from "../src/pages/CatalogPage";
const product: CatalogProduct = { id: "p1", nombre: "Polo oferta", precio: 100, descripcion: "Polo", categoria: "Running", marca: "FitLook", genero: "Hombre", imagenUrl: null, totalStock: 5, tallas: [
  { id: "m1", talla: "M", stock: 3, discountPercent: 20, salePrice: 80, discountEndsAt: "2099-01-01T00:00:00Z" },
  { id: "l1", talla: "L", stock: 2, discountPercent: 0, salePrice: 100 },
] };
describe("offer journey", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchCatalogProducts).mockResolvedValue([product]); });
  it("shows limited-time offers, then charges the exact selected size in the cart", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/producto/p1"]}><Routes><Route path="/producto/:id" element={<ProductDetailPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByText(/Oferta por tiempo limitado/)).toBeInTheDocument();
    expect(screen.getByText("Desde")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "M", exact: true }));
    await user.click(screen.getByRole("button", { name: /Agregar al carrito/i }));
    expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ price: 80, tallaId: "m1", size: "M" }));
  });
  it("does not replace an invalid product id with the first catalog entry", async () => {
    render(<MemoryRouter initialEntries={["/producto/missing"]}><Routes><Route path="/producto/:id" element={<ProductDetailPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByText("Producto no encontrado")).toBeInTheDocument();
    expect(screen.queryByText("Polo oferta")).not.toBeInTheDocument();
  });
  it("filters offers using the catalog URL and excludes expired promotions", async () => {
    vi.mocked(fetchCatalogProducts).mockResolvedValue([product, { ...product, id: "p2", nombre: "Oferta vencida", tallas: [{ ...product.tallas[0], discountEndsAt: "2020-01-01T00:00:00Z" }] }]);
    render(<MemoryRouter initialEntries={["/catalogo?ofertas=1"]}><CatalogPage /></MemoryRouter>);
    expect(await screen.findByText("Polo oferta")).toBeInTheDocument();
    expect(screen.queryByText("Oferta vencida")).not.toBeInTheDocument();
  });
});
