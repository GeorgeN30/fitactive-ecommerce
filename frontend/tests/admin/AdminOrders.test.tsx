import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminOrdersView from "../../src/components/admin/views/AdminOrdersView";
import { DEMO_ORDERS } from "../../src/data/adminPrototype";

describe("AdminOrdersView", () => {
  const updateOrderStatus = vi.fn();

  it("muestra la lista completa de pedidos", () => {
    render(
      <AdminOrdersView
        orders={DEMO_ORDERS}
        updateOrderStatus={updateOrderStatus}
      />
    );
    expect(screen.getByText("Gestión de Pedidos")).toBeInTheDocument();
    expect(screen.getByText("ORD-2026-001")).toBeInTheDocument();
    expect(screen.getByText("ORD-2026-004")).toBeInTheDocument();
  });

  it("filtra los pedidos por estado", async () => {
    const user = userEvent.setup();
    render(
      <AdminOrdersView
        orders={DEMO_ORDERS}
        updateOrderStatus={updateOrderStatus}
      />
    );
    await user.click(screen.getByRole("button", { name: /Pendiente/ }));
    expect(screen.getByText("ORD-2026-004")).toBeInTheDocument();
    expect(screen.queryByText("ORD-2026-001")).not.toBeInTheDocument();
  });

  it("despliega el detalle y cambia el estado de un pedido", async () => {
    const user = userEvent.setup();
    render(
      <AdminOrdersView
        orders={DEMO_ORDERS}
        updateOrderStatus={updateOrderStatus}
      />
    );
    await user.click(screen.getByText("ORD-2026-001"));
    expect(screen.getByText("Cambiar estado")).toBeInTheDocument();
    const deliveredButton = screen.getByRole("button", { name: "Entregado" });
    await user.click(deliveredButton);
    expect(updateOrderStatus).toHaveBeenCalledWith("ORD-2026-001", "delivered");
    expect(screen.getAllByText("Entregado").length).toBeGreaterThan(0);
  });
});