import { describe, it, expect, vi, beforeAll } from "vitest";

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    (() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
});
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import AdminDashboard from "../../src/pages/admin/AdminDashboard";

vi.mock("react-chartjs-2", () => ({
  Line: () => null,
  Doughnut: () => null,
}));

vi.mock("../../src/services/admin", () => ({
  createProduct: vi.fn(),
  deleteProduct: vi.fn(),
  fetchCustomers: vi.fn().mockResolvedValue([]),
  fetchUsers: vi.fn().mockResolvedValue([]),
  fetchDashboardStats: vi.fn().mockResolvedValue({
    totalSales: 0,
    salesGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    activeCustomers: 0,
    customersGrowth: 0,
    productsSold: 0,
    productsGrowth: 0,
    totalReturns: 0,
  }),
  fetchOrders: vi.fn().mockResolvedValue([]),
  fetchProducts: vi.fn().mockResolvedValue([]),
  fetchSalesData: vi.fn().mockResolvedValue([]),
  updateOrderStatus: vi.fn(),
  updateCustomerRole: vi.fn(),
  updateProduct: vi.fn(),
}));

vi.mock("../../src/services/notifications", () => ({
  connectAdminSocket: vi.fn(() => () => undefined),
  mapLiveEventToAdminNotification: vi.fn(),
}));

function renderDashboard() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe("AdminDashboard", () => {
  it("muestra el dashboard financiero por defecto", async () => {
    renderDashboard();
    expect(screen.getByText("Dashboard Financiero")).toBeInTheDocument();
    expect(screen.getByText("Últimos pedidos")).toBeInTheDocument();
  });

  it("navega a la vista de pedidos desde el sidebar", async () => {
    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Pedidos" }));
    expect(await screen.findByText("Gestión de Pedidos")).toBeInTheDocument();
    expect(screen.getByText("No hay pedidos con este estado.")).toBeInTheDocument();
  });

  it("navega a roles y accesos desde el sidebar", async () => {
    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Roles y accesos" }));
    expect(await screen.findByText("Usuarios del sistema")).toBeInTheDocument();
  });

  it("aplica el tema oscuro a la cabecera del panel", () => {
    renderDashboard();

    const headerTitle = screen.getByRole("heading", {
      name: "Dashboard",
      level: 2,
    });
    const header = headerTitle.closest("header");

    expect(header).toHaveClass("dark:bg-zinc-900");
    expect(headerTitle).toHaveClass("dark:text-white");
  });

  it("navega al módulo mock de devoluciones", async () => {
    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Devoluciones" }));
    expect(await screen.findByRole("heading", { name: "Devoluciones", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Esta vista es demostrativa/)).toBeInTheDocument();
    expect(screen.getByText("ORD-2026-00841")).toBeInTheDocument();
  });
});
