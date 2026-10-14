import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
vi.mock("../../src/services/admin", () => ({ fetchProducts: vi.fn(), createProduct: vi.fn(), updateProduct: vi.fn(), deleteProduct: vi.fn() }));
import { createProduct, fetchProducts } from "../../src/services/admin";
import AdminProductsView from "../../src/components/admin/views/AdminProductsView";
describe("database-backed product administration", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchProducts).mockResolvedValueOnce([]).mockResolvedValue([{ id: "p1", name: "Polo API", category: "Running", sport: "Training", price: 25, image: "", images: [], sizes: ["M"], availableColors: [], description: "", stock: { M: 4 }, gender: "unisex", measurements: { chest: [0, 0], waist: [0, 0], hips: [0, 0] }, featured: false, minStock: 0 }]); vi.mocked(createProduct).mockResolvedValue({ id: "p1", name: "Polo API", category: "Running", sport: "Training", price: 25, image: "", images: [], sizes: ["M"], availableColors: [], description: "", stock: { M: 4 }, gender: "unisex", measurements: { chest: [0, 0], waist: [0, 0], hips: [0, 0] }, featured: false, minStock: 0 }); });
  it("loads an empty state from the API and submits validated product details", async () => {
    const user = userEvent.setup(); render(<AdminProductsView />);
    expect(await screen.findByText("No hay productos que coincidan.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nombre del producto"), "Polo API"); await user.clear(screen.getByLabelText("Precio")); await user.type(screen.getByLabelText("Precio"), "25");
    await user.clear(screen.getByLabelText("Stock por talla")); await user.type(screen.getByLabelText("Stock por talla"), "4");
    await user.click(screen.getByRole("button", { name: "Crear producto" }));
    expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Polo API", precio: 25, tallas: [{ talla: "M", stock: 4 }] }));
    expect(await screen.findByText("Polo API")).toBeInTheDocument();
  });
  it("does not POST invalid or empty products", async () => {
    const user = userEvent.setup(); render(<AdminProductsView />);
    await screen.findByText("No hay productos que coincidan."); await user.click(screen.getByRole("button", { name: "Crear producto" }));
    expect(createProduct).not.toHaveBeenCalled();
  });
});
