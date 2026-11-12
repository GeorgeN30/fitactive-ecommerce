import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InventoryCatalogView from "../../src/components/inventory/views/InventoryCatalogView";
import InventoryStockView from "../../src/components/inventory/views/InventoryStockView";
import type { Product } from "../../src/data/adminPrototypeTypes";

const product: Product = {
  id: "product-1",
  name: "Polo de prueba",
  category: "Clothing",
  sport: "Running",
  price: 99,
  image: "https://example.com/product.jpg",
  images: ["https://example.com/product.jpg"],
  sizes: ["S", "M"],
  availableColors: [],
  description: "Producto de prueba",
  stock: { S: 3, M: 5 },
  gender: "unisex",
  measurements: { chest: [80, 100], waist: [60, 90], hips: [80, 100] },
  featured: false,
  minStock: 5,
};

describe("inventory modal positioning", () => {
  it("renders the add-product dialog directly under document.body", async () => {
    const user = userEvent.setup();
    render(
      <InventoryCatalogView products={[product]} setProducts={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /Añadir Producto/i }));

    const dialog = screen.getByRole("dialog", { name: "Nuevo Producto" });
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(dialog).toBeVisible();
  });

  it("renders the stock dialog directly under document.body", async () => {
    const user = userEvent.setup();
    render(
      <InventoryStockView
        products={[product]}
        setProducts={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Editar stock" }));

    const dialog = screen.getByRole("dialog", { name: "Ajustar Stock" });
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(dialog).toBeVisible();
  });

  it("sends the entered stock and an image URL when creating a product", async () => {
    const user = userEvent.setup();
    const onAddProduct = vi.fn().mockResolvedValue({ ...product, id: "product-2" });
    render(
      <InventoryCatalogView
        products={[product]}
        setProducts={vi.fn()}
        onAddProduct={onAddProduct}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Añadir Producto/i }));
    await user.type(screen.getByLabelText(/Nombre del producto/i), " Nuevo");
    await user.type(screen.getByLabelText("SKU *"), "-NEW");
    await user.type(screen.getByLabelText(/Precio \(S\/\)/i), "10");
    await user.clear(screen.getByLabelText("Stock talla 1"));
    await user.type(screen.getByLabelText("Stock talla 1"), "7");
    await user.type(screen.getByLabelText("URL de imagen"), "https://cdn.example.com/front.jpg");
    await user.click(screen.getByRole("button", { name: "Agregar URL" }));
    await user.click(screen.getAllByRole("button", { name: "Añadir Producto" })[1]);

    await waitFor(() => expect(onAddProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        stock: 7,
        imageUrls: ["https://cdn.example.com/front.jpg"],
      }),
    ));
  });

  it("sends multiple sizes with stock and measurement ranges", async () => {
    const user = userEvent.setup();
    const onAddProduct = vi.fn().mockResolvedValue({ ...product, id: "product-3" });
    render(
      <InventoryCatalogView
        products={[product]}
        setProducts={vi.fn()}
        onAddProduct={onAddProduct}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Añadir Producto/i }));
    await user.type(screen.getByLabelText(/Nombre del producto/i), " Polo por tallas");
    await user.type(screen.getByLabelText("SKU *"), "-SIZES");
    await user.type(screen.getByLabelText(/Precio \(S\/\)/i), "10");
    await user.clear(screen.getByLabelText("Stock talla 1"));
    await user.type(screen.getByLabelText("Stock talla 1"), "5");
    await user.click(screen.getByRole("button", { name: /Talla/i }));
    await user.type(screen.getByLabelText("Talla 2"), "S");
    await user.clear(screen.getByLabelText("Stock talla 2"));
    await user.type(screen.getByLabelText("Stock talla 2"), "3");
    await user.type(screen.getByLabelText("Medida mínima talla 2"), "80");
    await user.type(screen.getByLabelText("Medida máxima talla 2"), "90");
    await user.click(screen.getAllByRole("button", { name: "Añadir Producto" })[1]);

    await waitFor(() => expect(onAddProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        sizes: [
          { size: "M", stock: 5, rangoCmMin: null, rangoCmMax: null },
          { size: "S", stock: 3, rangoCmMin: 80, rangoCmMax: 90 },
        ],
      }),
    ));
  });

  it("opens the file picker and previews multiple selected images", async () => {
    const user = userEvent.setup();
    render(
      <InventoryCatalogView products={[product]} setProducts={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /Añadir Producto/i }));
    const files = [
      new File(["front"], "front.png", { type: "image/png" }),
      new File(["back"], "back.jpg", { type: "image/jpeg" }),
    ];
    await user.upload(screen.getByLabelText("Imágenes del producto"), files);

    await waitFor(() => {
      expect(screen.getByAltText("Vista previa 1")).toBeVisible();
      expect(screen.getByAltText("Vista previa 2")).toBeVisible();
    });
  });
});
