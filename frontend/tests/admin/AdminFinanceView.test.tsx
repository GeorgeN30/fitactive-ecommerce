import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminFinanceView from "../../src/components/admin/views/AdminFinanceView";
import { fetchFinanceData } from "../../src/services/finance";

vi.mock("../../src/services/finance", () => ({
  fetchFinanceData: vi.fn(),
}));

const financeData = {
  period: "month" as const,
  periodLabel: "Últimos 12 meses",
  revenue: 1250,
  ordersCount: 3,
  returnsCount: 0,
  monthlyRevenue: [
    { label: "Oct", value: 1250 },
    { label: "Nov", value: 0 },
  ],
  transactions: [
    {
      reference: "ORD-001",
      description: "Venta online",
      date: "2026-10-01",
      amount: 1250,
      type: "Ingreso" as const,
    },
  ],
  categories: [
    { name: "Clothing", amount: 1250, units: 3, percentage: 100 },
  ],
  expenses: null,
  paymentMethods: [],
};

describe("AdminFinanceView", () => {
  beforeEach(() => {
    vi.mocked(fetchFinanceData).mockResolvedValue(financeData);
  });

  it("renders real finance data and marks unavailable sections clearly", async () => {
    render(<AdminFinanceView />);

    expect(await screen.findByText("Finanzas")).toBeInTheDocument();
    expect(screen.queryByText("Conectado")).not.toBeInTheDocument();
    expect(screen.getAllByText("S/ 1,250.00").length).toBeGreaterThan(0);
    expect(screen.getByText("3 pedidos en el periodo")).toBeInTheDocument();
    expect(screen.getByText("Métodos de pago")).toBeInTheDocument();
    expect(screen.getByText(/Mercado Pago y otros métodos aparecerán/)).toBeInTheDocument();
    expect(screen.getByText("ORD-001")).toBeInTheDocument();
  });

  it("shows an honest empty state when the database has no finance data", async () => {
    vi.mocked(fetchFinanceData).mockResolvedValue({
      period: "month",
      periodLabel: "Últimos 12 meses",
      revenue: 0,
      ordersCount: 0,
      returnsCount: 0,
      monthlyRevenue: [],
      transactions: [],
      categories: [],
      expenses: null,
      paymentMethods: [],
    });
    render(<AdminFinanceView />);

    await waitFor(() => {
      expect(screen.getByText("Aún no hay ventas registradas en la base de datos.")).toBeInTheDocument();
    });
    expect(screen.getByText("No hay movimientos financieros registrados todavía.")).toBeInTheDocument();
  });
});
