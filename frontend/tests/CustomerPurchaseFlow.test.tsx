import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

vi.mock("../src/components/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock("../src/context/FavoritesContext", () => ({
  useFavorites: vi.fn(),
}));
vi.mock("../src/context/CartContext", () => ({
  useCart: vi.fn(),
}));
vi.mock("../src/services/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/services/catalog")>()),
  fetchCatalogProducts: vi.fn(),
}));
vi.mock("../src/services/orders", () => ({
  resolveOrderEntries: vi.fn(),
  createOrder: vi.fn(),
}));

import HomePage from "../src/pages/HomePage";
import CartPage from "../src/pages/CartPage";
import FavoritesPage from "../src/pages/FavoritesPage";
import CheckoutPage from "../src/pages/CheckoutPage";
import { useCart } from "../src/context/CartContext";
import { useFavorites } from "../src/context/FavoritesContext";
import { fetchCatalogProducts } from "../src/services/catalog";
import { createOrder, resolveOrderEntries } from "../src/services/orders";

const catalogProduct = {
  id: "real-product-1",
  nombre: "Polo real",
  descripcion: null,
  categoria: "Running",
  marca: null,
  precio: 100,
  imagenUrl: null,
  genero: null,
  tallas: [
    { id: "size-s", talla: "S", stock: 0, discountPercent: 40, salePrice: 60 },
    { id: "size-m", talla: "M", stock: 5, discountPercent: 20, salePrice: 80 },
  ],
  totalStock: 5,
};

const cartItem = {
  id: "real-product-1",
  name: "Polo real",
  price: 99,
  img: "/polo.png",
  quantity: 1,
  size: "M",
  color: "Único",
  tallaId: "size-m",
};

function renderPage(page: ReactNode) {
  return render(<MemoryRouter>{page}</MemoryRouter>);
}

describe("customer purchase flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFavorites).mockReturnValue({
      favorites: [],
      toggleFavorite: vi.fn(),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
    });
    vi.mocked(useCart).mockReturnValue({
      cartItems: [cartItem],
      cartTotal: 99,
      cartCount: 1,
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
    });
  });

  it("loads home products from the API and shows their available PEN price", async () => {
    vi.mocked(fetchCatalogProducts).mockResolvedValue([catalogProduct]);
    renderPage(<HomePage />);

    expect(await screen.findByText("Polo real")).toBeInTheDocument();
    expect(screen.getByText("S/ 80.00")).toBeInTheDocument();
    expect(screen.queryByText("AeroTech Compression Tee")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Polo real|Ver detalle/ }).some((link) => link.getAttribute("href") === "/producto/real-product-1")).toBe(true);
  });

  it("shows PEN amounts in cart and favorites", () => {
    renderPage(<CartPage />);
    expect(screen.getAllByText("S/ 99.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("$99.00")).not.toBeInTheDocument();

    vi.mocked(useFavorites).mockReturnValue({
      favorites: [{ id: "real-product-1", cat: "Running", name: "Polo real", price: 80, img: "/polo.png" }],
      toggleFavorite: vi.fn(),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
      isFavorite: vi.fn(() => true),
    });
    renderPage(<FavoritesPage />);
    expect(screen.getByText("S/ 80.00")).toBeInTheDocument();
  });

  it("registers a pending order without card fields or a false payment confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(resolveOrderEntries).mockResolvedValue([{ productoTallaId: "size-m", cantidad: 1 }]);
    vi.mocked(createOrder).mockResolvedValue({
      id: "order-1",
      numero: "ORD-2026-TEST",
      total: 80,
      estado: "pending",
      fechaOrden: null,
      entries: [{ productoTallaId: "size-m", nombre: "Polo real", talla: "M", cantidad: 1, precioUnitario: 80, subtotal: 80 }],
    });
    renderPage(<CheckoutPage />);

    await user.type(screen.getByPlaceholderText("Ej. Juan Pérez"), "Juan Pérez");
    await user.type(screen.getByPlaceholderText("correo@ejemplo.com"), "juan@test.com");
    await user.type(screen.getByPlaceholderText("999 999 999"), "999999999");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.type(screen.getByPlaceholderText("Av. Javier Prado 1234"), "Av. Central 123");
    await user.type(screen.getByPlaceholderText("Miraflores"), "Miraflores");
    await user.type(screen.getByPlaceholderText("Lima"), "Lima");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Continuar al resumen" }));

    expect(screen.getByText("Confirmar pedido")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("0000 0000 0000 0000")).not.toBeInTheDocument();
    expect(screen.queryByText("CVV")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Registrar pedido por S/ 99.00" }));

    expect(await screen.findByText("Pedido registrado")).toBeInTheDocument();
    expect(screen.getByText(/No se ha realizado ningún cobro/)).toBeInTheDocument();
    expect(screen.getAllByText("S/ 80.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("Compra exitosa")).not.toBeInTheDocument();
    expect(vi.mocked(createOrder)).toHaveBeenCalledWith([{ productoTallaId: "size-m", cantidad: 1 }]);
  });
});
