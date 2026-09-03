import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminInventory from "../../src/pages/admin/AdminInventory";

describe("AdminInventory", () => {
  it("muestra la alerta de stock bajo y el panel de inventario", () => {
    render(<AdminInventory />);
    expect(screen.getByText("Control de Inventario")).toBeInTheDocument();
    expect(screen.getByText(/2 productos con bajo stock requieren/)).toBeInTheDocument();
    expect(screen.getAllByText("AeroTech Compression Tee").length).toBeGreaterThan(0);
  });

  it("filtra los productos por stock bajo", async () => {
    const user = userEvent.setup();
    render(<AdminInventory />);
    await user.click(screen.getByText("Ver productos"));
    expect(screen.getAllByText("Vortex Weightlifting Shoes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Apex Performance Shorts").length).toBeGreaterThan(0);
  });

  it("modifica el stock de un producto desplegando el editor", async () => {
    const user = userEvent.setup();
    render(<AdminInventory />);
    await user.click(screen.getAllByRole("button", { name: "Modificar" })[0]);
    expect(screen.getByText("Modificar stock para M:")).toBeInTheDocument();
  });
});