import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminNotifications from "../../src/pages/admin/AdminNotifications";

describe("AdminNotifications", () => {
  it("lista las notificaciones del sistema", () => {
    render(<AdminNotifications onNavigate={vi.fn()} />);
    expect(screen.getByText("Centro de Notificaciones")).toBeInTheDocument();
    expect(screen.getByText("Nuevo Pedido #FL-2026-00847")).toBeInTheDocument();
    expect(screen.getByText("Alerta de Stock Bajo")).toBeInTheDocument();
  });

  it("navega a la tab destino al pulsar Ver", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<AdminNotifications onNavigate={onNavigate} />);
    await user.click(screen.getAllByRole("button", { name: "Ver" })[0]);
    expect(onNavigate).toHaveBeenCalledWith("orders");
  });

  it("navega a inventario y devoluciones segun la notificacion", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<AdminNotifications onNavigate={onNavigate} />);
    await user.click(screen.getAllByRole("button", { name: "Ver" })[1]);
    expect(onNavigate).toHaveBeenCalledWith("inventory");
    await user.click(screen.getAllByRole("button", { name: "Ver" })[3]);
    expect(onNavigate).toHaveBeenCalledWith("returns");
  });
});