import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminProducts from "../../src/pages/admin/AdminProducts";

describe("AdminProducts", () => {
  it("muestra KPIs y el listado inicial de productos", () => {
    render(<AdminProducts />);
    expect(screen.getByText("Gestion de Productos")).toBeInTheDocument();
    expect(screen.getByText("AeroTech Compression Tee")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1-6 de 6 productos")).toBeInTheDocument();
  });

  it("filtra por nombre", async () => {
    const user = userEvent.setup();
    render(<AdminProducts />);
    await user.type(screen.getByPlaceholderText("Buscar por nombre, categoria o SKU..."), "Nova");
    expect(screen.getByText("Nova Carbon Windbreaker")).toBeInTheDocument();
    expect(screen.queryByText("AeroTech Compression Tee")).not.toBeInTheDocument();
  });

  it("filtra por estado", async () => {
    const user = userEvent.setup();
    render(<AdminProducts />);
    await user.selectOptions(screen.getAllByRole("combobox")[2], "Inactive");
    expect(screen.getByText("Velo Speed Cycle Bib")).toBeInTheDocument();
    expect(screen.queryByText("AeroTech Compression Tee")).not.toBeInTheDocument();
  });

  it("elimina un producto", async () => {
    const user = userEvent.setup();
    render(<AdminProducts />);
    await user.click(screen.getByRole("button", { name: "Eliminar AeroTech Compression Tee" }));
    expect(screen.queryByText("AeroTech Compression Tee")).not.toBeInTheDocument();
    expect(screen.getByText("Mostrando 1-5 de 5 productos")).toBeInTheDocument();
  });

  it("crea un producto mediante el modal", async () => {
    const user = userEvent.setup();
    render(<AdminProducts />);
    await user.click(screen.getByRole("button", { name: "Nuevo Producto" }));

    const dialog = screen.getByRole("dialog");
    const nameInput = dialog.querySelector('input[type="text"]') as HTMLInputElement;
    const priceInput = dialog.querySelectorAll('input[type="number"]')[0] as HTMLInputElement;
    const stockInput = dialog.querySelectorAll('input[type="number"]')[1] as HTMLInputElement;

    await user.type(nameInput, "Leggings Pro Fit");
    await user.type(priceInput, "49.90");
    await user.type(stockInput, "10");
    await user.click(within(dialog).getByRole("button", { name: "L" }));
    await user.click(screen.getByRole("button", { name: "Guardar Producto" }));

    expect(screen.getByText("Mostrando 1-6 de 7 productos")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByText("Leggings Pro Fit")).toBeInTheDocument();
  });
});