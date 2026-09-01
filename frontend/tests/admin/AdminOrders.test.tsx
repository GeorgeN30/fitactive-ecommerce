import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminOrders from "../../src/pages/admin/AdminOrders";

describe("AdminOrders", () => {
  it("muestra KPIs de pedidos y la lista completa", () => {
    render(<AdminOrders />);
    expect(screen.getByText("Gestion de Pedidos")).toBeInTheDocument();
    expect(screen.getByText("#FL-2026-00847")).toBeInTheDocument();
    expect(screen.getByText("Total Pedidos")).toBeInTheDocument();
  });

  it("filtra los pedidos por estado", async () => {
    const user = userEvent.setup();
    render(<AdminOrders />);
    const statusFilter = screen.getByLabelText("Filtrar por estado");
    await user.selectOptions(statusFilter, "Pending");
    expect(screen.getByText("#FL-2026-00845")).toBeInTheDocument();
    expect(screen.queryByText("#FL-2026-00846")).not.toBeInTheDocument();
  });

  it("despliega el detalle de un pedido", async () => {
    const user = userEvent.setup();
    render(<AdminOrders />);
    await user.click(screen.getAllByRole("button", { name: "Expandir" })[0]);
    expect(screen.getByText("Items del Pedido")).toBeInTheDocument();
    expect(screen.getByText("#FL-2026-00847")).toBeInTheDocument();
  });

  it("cambia el estado de un pedido mediante el selector", async () => {
    const user = userEvent.setup();
    render(<AdminOrders />);
    const statusSelect = screen.getByLabelText("Estado del pedido FL-2026-00847");
    expect((statusSelect as HTMLSelectElement).value).toBe("Confirmed");
    await user.selectOptions(statusSelect, "Shipped");
    expect((statusSelect as HTMLSelectElement).value).toBe("Shipped");
  });
});