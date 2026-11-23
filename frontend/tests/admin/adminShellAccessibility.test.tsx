import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboard from "../../src/pages/admin/AdminDashboard";

const theme = vi.hoisted(() => ({ resolvedTheme: "dark", setTheme: vi.fn() }));
vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "system", ...theme }) }));
vi.mock("../../src/components/admin/views/DashboardView", () => ({
  default: () => <h1>Dashboard Financiero</h1>,
}));
vi.mock("../../src/components/admin/views/AdminRolesAccessView", () => ({
  default: () => <h1>Usuarios del sistema</h1>,
}));
vi.mock("../../src/components/admin/views/AdminNotificationsView", () => ({
  default: () => <h1>Notificaciones</h1>,
}));
vi.mock("../../src/services/admin", () => ({
  fetchOrders: vi.fn().mockResolvedValue([]),
  fetchProducts: vi.fn().mockResolvedValue([]),
  fetchCustomers: vi.fn().mockResolvedValue([]),
  fetchUsers: vi.fn().mockResolvedValue([]),
  fetchDashboardStats: vi.fn().mockResolvedValue(null),
  fetchSalesData: vi.fn().mockResolvedValue([]),
  createProduct: vi.fn(), updateProduct: vi.fn(), deleteProduct: vi.fn(),
  updateOrderStatus: vi.fn(), updateCustomerStatus: vi.fn(), updateCustomerRole: vi.fn(),
}));
vi.mock("../../src/services/notifications", () => ({
  connectAdminSocket: vi.fn(() => () => undefined),
  fetchNotifications: vi.fn().mockResolvedValue([{ id: "1", read: false }]),
  markAllNotificationsRead: vi.fn(), markNotificationRead: vi.fn(),
  mapLiveEventToAdminNotification: vi.fn(),
}));

function renderShell() {
  return render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
}

describe("admin shell accessibility", () => {
  beforeEach(() => {
    theme.resolvedTheme = "dark";
    theme.setTheme.mockClear();
  });

  it("exposes the resolved system theme as a named toggle", () => {
    const { rerender } = renderShell();
    const toggle = screen.getByRole("button", { name: "Modo oscuro", pressed: true });
    fireEvent.click(toggle);
    expect(theme.setTheme).toHaveBeenCalledWith("light");

    theme.resolvedTheme = "light";
    rerender(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Modo oscuro", pressed: false }));
    expect(theme.setTheme).toHaveBeenLastCalledWith("dark");
  });

  it("names notification controls and describes unread counts", async () => {
    renderShell();
    const button = await screen.findByRole("button", { name: "Notificaciones, 1 sin leer" });
    expect(screen.getByRole("button", { name: /Notificaciones\s*, notificaciones sin leer: 1/ })).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByRole("heading", { name: "Notificaciones", level: 1 })).toBeInTheDocument();
  });

  it("keeps the page heading in main and preserves roles and security navigation", () => {
    renderShell();
    const header = screen.getByRole("banner");
    expect(within(header).queryByRole("heading")).not.toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByRole("heading", { level: 1 })).toHaveTextContent("Dashboard Financiero");
    expect(screen.getByRole("link", { name: "Seguridad de mi cuenta" })).toHaveAttribute("href", "/configuracion");
    fireEvent.click(screen.getByRole("button", { name: "Roles y accesos" }));
    expect(screen.getByRole("heading", { name: "Usuarios del sistema", level: 1 })).toBeInTheDocument();
  });
});
