import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminHeader from "../../src/components/admin/AdminHeader";
vi.mock("../../src/services/notifications", () => ({ fetchNotifications: vi.fn(), markNotificationRead: vi.fn().mockResolvedValue(undefined) }));
import { fetchNotifications } from "../../src/services/notifications";

const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }));

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "George", email: "george@fitlook.com", role: "admin", picture: null },
    logout: logoutMock,
  }),
}));

describe("AdminHeader", () => {
  const notifications = Array.from({ length: 4 }, (_, index) => ({ id: `n${index}`, title: index === 0 ? "Nuevo Pedido #FL-2026-00847" : `Notificación ${index}`, message: "Evento real", type: index === 0 ? "order" : "stock", date: "hoy", read: false, priority: "high" as const }));
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchNotifications).mockResolvedValue(notifications); });
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

  it("despliega notificaciones pendientes cargadas desde la API", async () => {
    const user = userEvent.setup();
    render(<AdminHeader activeTab="dashboard" onTabChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Notificaciones" }));
    expect(await screen.findByText("4 Nuevas")).toBeInTheDocument();
    expect(screen.getByText("Nuevo Pedido #FL-2026-00847")).toBeInTheDocument();
  });

  it("navega a la tab destino al hacer click en una notificacion", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<AdminHeader activeTab="dashboard" onTabChange={onTabChange} />);
    await user.click(screen.getByRole("button", { name: "Notificaciones" }));
    await screen.findByText("4 Nuevas");
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
