import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminHeader from "../../src/components/admin/AdminHeader";

const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }));

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "George", email: "george@fitlook.com", role: "admin", picture: null },
    logout: logoutMock,
  }),
}));

describe("AdminHeader", () => {
  it("muestra el titulo y subtitulo para la tab activa", () => {
    render(<AdminHeader activeTab="orders" onTabChange={vi.fn()} />);
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.getByText("Seguimiento de pedidos · FITLOOK")).toBeInTheDocument();
  });

  it("muestra usuario y boton de cerrar sesion", () => {
    render(<AdminHeader activeTab="dashboard" onTabChange={vi.fn()} />);
    expect(screen.getByText("George")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("despliega el panel de notificaciones con el conteo pendiente", async () => {
    const user = userEvent.setup();
    render(<AdminHeader activeTab="dashboard" onTabChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Notificaciones" }));
    expect(screen.getByText("4 Nuevas")).toBeInTheDocument();
    expect(screen.getByText("Nuevo Pedido #FL-2026-00847")).toBeInTheDocument();
  });

  it("navega a la tab destino al hacer click en una notificacion", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<AdminHeader activeTab="dashboard" onTabChange={onTabChange} />);
    await user.click(screen.getByRole("button", { name: "Notificaciones" }));
    await user.click(screen.getByText("Nuevo Pedido #FL-2026-00847"));
    expect(onTabChange).toHaveBeenCalledWith("orders");
  });

  it("cierra sesion al hacer click en salir", async () => {
    const user = userEvent.setup();
    render(<AdminHeader activeTab="dashboard" onTabChange={vi.fn()} />);
    await user.click(screen.getByTitle("Cerrar"));
    expect(logoutMock).toHaveBeenCalled();
  });
});